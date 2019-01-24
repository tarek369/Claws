package main

import (
	"bytes"
	"fmt"
	"net/http"
	"syscall/js"
	"github.com/dgrijalva/jwt-go"
	"golang.org/x/crypto/salsa20"
	"encoding/hex"
	"encoding/json"
	"crypto/rand"
	"strings"
)

var SECRET_CLIENT_ID string
var TMDB_API_KEY string

func toJSON(m interface{}) string {
	js, err := json.Marshal(m)
	if err != nil {
		println(fmt.Sprintf("response error: %v", err))
	}
	return strings.Replace(string(js), ",", ", ", -1)
}

func parseResponseJSON(resp *http.Response) (body map[string]interface{}, err error) {
	defer resp.Body.Close()

	if resp.StatusCode >= 400 {
		err = fmt.Errorf("response status code: %d", resp.StatusCode)
		return
	}

	var buf bytes.Buffer
	_, err = buf.ReadFrom(resp.Body)
	if err != nil {
		return
	}
	var mapTemp interface{}
	bodyString := buf.String()
	err = json.Unmarshal([]byte(bodyString), &mapTemp)
	if err != nil {
		return
	}
	body = mapTemp.(map[string]interface{})
	return
}

func get(url string) (body map[string]interface{}, err error) {
	var resp *http.Response
	resp, err = http.Get(url)
	if err != nil {
		err = fmt.Errorf("response error: %v", err)
		return
	}
	body, err = parseResponseJSON(resp)
	return
}

func post(url string, data string) (body map[string]interface{}, err error) {
	var resp *http.Response
	var jsonData interface{}
	err = json.Unmarshal([]byte(data), &jsonData)
	if err != nil {
		return
	}
	json := toJSON(jsonData)
	resp, err = http.Post(url, "application/json", strings.NewReader(json))
	if err != nil {
		err = fmt.Errorf("response error: %v", err)
		return
	}
	body, err = parseResponseJSON(resp)
	return
}

func verifyToken(tokenString string) (error) {
	// Parse takes the token string and a function for looking up the key. The latter is especially
	// useful if you use multiple keys for your application.  The standard is to use 'kid' in the
	// head of the token to identify which key to use, but the parsed token (head and claims) is provided
	// to the callback, providing flexibility.
	token, err := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
	    // Don't forget to validate the alg is what you expect:
	    if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
	        return nil, fmt.Errorf("Unexpected signing method: %v", token.Header["alg"])
	    }

	    // hmacSampleSecret is a []byte containing your secret, e.g. []byte("my_secret_key")
	    return []byte(SECRET_CLIENT_ID), nil
	})

	if token.Valid {
	    return nil
	} else if ve, ok := err.(*jwt.ValidationError); ok {
	    if ve.Errors&jwt.ValidationErrorMalformed != 0 {
	        return fmt.Errorf("That's not even a token")
	    } else if ve.Errors&(jwt.ValidationErrorExpired|jwt.ValidationErrorNotValidYet) != 0 {
	        // Token is either expired or not active yet
	        return fmt.Errorf("Token is either expired or not active yet")
	    } else {
	        return fmt.Errorf("Couldn't handle this token: %v", err)
	    }
	} else {
	    return fmt.Errorf("Couldn't handle this token: %v", err)
	}
}

func authenticate(i []js.Value) {
	go func() {
		token := js.Global().Get("localStorage").Call("getItem", "token")
		if token != js.ValueOf(nil) {
	        err := verifyToken(token.String())
	        if err == nil {
				i[0].Invoke(token)
				return
	        } else {
	        	println(fmt.Sprintf("Verfy token error: %v", err))
	        }
		}

		out := []byte(SECRET_CLIENT_ID)
		in := []byte(SECRET_CLIENT_ID)

		length := 8
		nonce := make([]byte, length)
		_, err := rand.Read(nonce)
		if err != nil {
			println(fmt.Sprintf("Random read error: %v", err))
			return
		}
		nonceString := hex.EncodeToString(nonce)

		var key [32]byte
		copy(key[:], SECRET_CLIENT_ID[:32])

		salsa20.XORKeyStream(out, in, nonce, &key)

		encryptedString := hex.EncodeToString(out)

		body, err := post("/api/v1/login", fmt.Sprintf(`{"clientID": "%s"}`, nonceString + "|" + encryptedString))
		if err != nil {
			println(fmt.Sprintf("Login request error: %v", err))
			return
		}

        if body["auth"].(bool) {
			token = js.ValueOf(body["token"].(string));
            js.Global().Get("localStorage").Call("setItem", "token", token)
        }

        i[0].Invoke(token)
	}()
}

func fetchSearchResults(i []js.Value) {
	go func() {
		title := i[1].String()
		pageNumber := i[2].Int()
		url := fmt.Sprintf("https://api.themoviedb.org/3/search/multi?api_key=%s&language=en-US&query=%s&page=%d&include_adult=false", TMDB_API_KEY, title, pageNumber)
		body, err := get(url)
		if err != nil {
			println(fmt.Sprintf("TMDB request error: %v", err))
			return
		}

        i[0].Invoke(js.ValueOf(body))
	}()
}

func registerCallbacks() {
	js.Global().Set("authenticate", js.NewCallback(authenticate))
	js.Global().Set("fetchSearchResults", js.NewCallback(fetchSearchResults))
}

func main() {
	c := make(chan struct{}, 0)
	println("WASM Go Initialized")
	registerCallbacks()
	<-c
}