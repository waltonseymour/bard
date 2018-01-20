package main

import (
	"encoding/json"
	"log"
	"net/http"

	"github.com/gorilla/websocket"
)

var upgrader = websocket.Upgrader{}

var purchaedMap = make(map[string]bool)
var webSocketMap = make(map[string]*websocket.Conn)

// map of payment request to userID
var invoiceMap = make(map[string]string)

type webSocketRequest struct {
	Method string `json:"method"`
	Value  string `json:"value"`
}

func setPurchased(userID string) {
	purchaedMap[userID] = true
}

func setUserID(userID string, ws *websocket.Conn) {
	webSocketMap[userID] = ws
}

func websocketHandler(w http.ResponseWriter, r *http.Request) {
	c, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Print("upgrade:", err)
		return
	}
	defer c.Close()

	for {
		_, message, err := c.ReadMessage()
		if err != nil {
			log.Println("read:", err)
			break
		}

		var request webSocketRequest

		json.Unmarshal(message, &request)

		if request.Method == "setUserID" {
			setUserID(request.Value, c)
		}
	}
}
