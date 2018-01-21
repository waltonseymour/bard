package main

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"path/filepath"

	"github.com/gorilla/mux"
	"github.com/roasbeef/btcutil"
	"github.com/waltonseymour/bard/lnrpc"
	"google.golang.org/grpc"
	"google.golang.org/grpc/credentials"
)

const address = "localhost:10009"

const (
	defaultTLSCertFilename  = "tls.cert"
	defaultMacaroonFilename = "admin.macaroon"
)

var (
	lndHomeDir          = btcutil.AppDataDir("lnd", false)
	defaultTLSCertPath  = filepath.Join(lndHomeDir, defaultTLSCertFilename)
	defaultMacaroonPath = filepath.Join(lndHomeDir, defaultMacaroonFilename)
)

func main() {
	// routing
	r := mux.NewRouter()
	r.PathPrefix("/static/").Handler(http.StripPrefix("/static/", http.FileServer(http.Dir("./web/build/static"))))
	r.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		http.ServeFile(w, r, "./web/build/index.html")
	})

	r.HandleFunc("/websocket", websocketHandler)
	r.HandleFunc("/invoice", addInvoice).Methods("POST")

	createInvoiceListener()

	http.Handle("/", r)
	log.Fatal(http.ListenAndServe(":80", r))
}

func getClientConn() *grpc.ClientConn {
	creds, err := credentials.NewClientTLSFromFile(defaultTLSCertPath, "")
	conn, err := grpc.Dial(address, grpc.WithTransportCredentials(creds))
	if err != nil {
		log.Fatalf("did not connect: %v", err)
	}

	return conn
}

func getClient() (lnrpc.LightningClient, func()) {
	conn := getClientConn()

	cleanUp := func() {
		conn.Close()
	}

	return lnrpc.NewLightningClient(conn), cleanUp
}

func createInvoiceListener() {
	// do not clean up
	client, _ := getClient()

	subscriptionClient, err := client.SubscribeInvoices(context.Background(), &lnrpc.InvoiceSubscription{})
	if err != nil {
		log.Fatalf("unable to subscribe to invoice updates: %v", err)
	}
	go func() {
		invoiceUpdate, err := subscriptionClient.Recv()
		if err != nil {
			log.Fatalf("unable to recieve to invoice updates: %v", err)
		}
		if invoiceUpdate != nil && invoiceUpdate.Settled {
			userID := invoiceMap[invoiceUpdate.PaymentRequest]
			socket := webSocketMap[userID]
			log.Printf("Payment recieved for userID %s", userID)
			if socket != nil {
				log.Printf("Sending payment notice to userID %s", userID)
				setPurchased(userID)
				socket.WriteJSON("Paid")
			}
		}
	}()
}

func walletBalance(w http.ResponseWriter, r *http.Request) {
	client, cleanup := getClient()
	defer cleanup()
	balance, err := client.WalletBalance(context.Background(), &lnrpc.WalletBalanceRequest{})
	if err != nil {
		fmt.Println(err)
	}
	writeJSON(w, balance)
}

func addInvoice(w http.ResponseWriter, r *http.Request) {
	client, cleanup := getClient()
	defer cleanup()

	userID := r.URL.Query().Get("userID")

	invoice, err := client.AddInvoice(context.Background(), &lnrpc.Invoice{
		Value: 100,
	})

	invoiceMap[invoice.PaymentRequest] = userID

	if err != nil {
		fmt.Println(err)
	}
	writeJSON(w, invoice)
}

func writeJSON(w http.ResponseWriter, v interface{}) {
	json, err := json.Marshal(v)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	w.Write(json)
}
