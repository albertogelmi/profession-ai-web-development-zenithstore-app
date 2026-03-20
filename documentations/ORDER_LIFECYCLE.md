# 🔄 Ciclo di Vita degli Ordini - ZenithStore Online

Questo documento descrive in dettaglio il ciclo di vita completo di un ordine nel sistema ZenithStore Online, dalla creazione del carrello fino alla consegna finale, incluse le integrazioni con sistemi esterni per pagamenti e spedizioni.

---

## 📋 Indice

1. [Premesse Fondamentali](#premesse-fondamentali)
2. [Stati dell'Ordine](#stati-dellordine)
3. [Gestione dello Stock](#gestione-dello-stock)
4. [Fasi del Ciclo di Vita](#fasi-del-ciclo-di-vita)
   - [1. Gestione Carrello Frontend](#1-gestione-carrello-frontend)
   - [2. Checkout e Creazione Ordine (localStorage → RESERVED)](#2-checkout-e-creazione-ordine-localstorage--reserved)
   - [3. Aggiunta Indirizzo di Spedizione (RESERVED → RESERVED)](#3-aggiunta-indirizzo-di-spedizione-reserved--reserved)
   - [4. Pagamento e Conferma (RESERVED → NEW)](#4-pagamento-e-conferma-reserved--new)
   - [5. Elaborazione Ordine (NEW → PROCESSING)](#5-elaborazione-ordine-new--processing)
   - [6. Creazione Spedizione (PROCESSING → SHIPPING)](#6-creazione-spedizione-processing--shipping)
   - [7. Conferma Spedizione (SHIPPING → SHIPPED)](#7-conferma-spedizione-shipping--shipped)
   - [8. Consegna Ordine (SHIPPED → DELIVERED)](#8-consegna-ordine-shipped--delivered)
   - [9. Annullamento Ordine (→ CANCELLED)](#9-annullamento-ordine--cancelled)
   - [10. Consultazione e Reportistica](#10-consultazione-e-reportistica)
5. [Riepilogo Flusso Completo](#riepilogo-flusso-completo)
6. [Test Tool: orders.html](#test-tool-ordershtml)
7. [Notifiche Real-Time WebSocket](#notifiche-real-time-websocket)
8. [Integrazioni con Sistemi Esterni](#integrazioni-con-sistemi-esterni)
   - [Integrazione Pagamenti](#integrazione-pagamenti)
   - [Integrazione Spedizioni](#integrazione-spedizioni)
8. [Sicurezza e Best Practices](#sicurezza-e-best-practices)
9. [Supporto e Riferimenti](#supporto-e-riferimenti)

---

## 🎯 Premesse Fondamentali

### Principi di Base

- **Modello del Carrello**: Il carrello è gestito completamente a **frontend** usando `localStorage` via Zustand store. Il backend riceve il carrello solo al momento del checkout per validazione e creazione ordine.
- **Autenticazione Differenziata**: 
  - **Users** (operatori backoffice): richiedono JWT + middleware `domainRestriction` (localhost only)
  - **Customers** (clienti finali): richiedono JWT per operazioni sul proprio profilo
- **Transazionalità**: Tutte le operazioni critiche sono gestite in transazioni database per garantire consistenza
- **Idempotenza**: Il checkout cancella automaticamente ordini RESERVED esistenti prima di crearne uno nuovo, garantendo idempotenza
- **Semplicità POC**: Questo approccio semplificato elimina la complessità di sincronizzazione cart backend, ottimale per un proof of concept

---

## 📊 Stati dell'Ordine

Il ciclo di vita di un ordine attraversa i seguenti stati:

```
localStorage (FE) → RESERVED → NEW → PROCESSING → SHIPPING → SHIPPED → DELIVERED
                       ↓                                           ↓
                       └──────────────→ CANCELLED ←────────────────┘
```

| Stato | Descrizione | Modificabile | Stock Impact |
|-------|-------------|--------------|--------------|
| **localStorage** | Carrello in costruzione (solo frontend) | ✅ Sì | Nessuno (non esiste nel DB) |
| **RESERVED** | Stock riservato, in attesa di pagamento | ❌ No* | `reserved_quantity += qty` |
| **NEW** | Pagamento confermato, pronto per elaborazione | ❌ No | Stock già riservato |
| **PROCESSING** | In elaborazione da operatore backoffice | ❌ No | Nessuno |
| **SHIPPING** | Spedizione creata, in preparazione | ❌ No | Nessuno |
| **SHIPPED** | Pacco consegnato al corriere | ❌ No | `available_quantity -= qty`<br>`reserved_quantity -= qty` |
| **DELIVERED** | Consegnato al cliente | ❌ No | Nessuno |
| **CANCELLED** | Ordine annullato | ❌ No | `reserved_quantity -= qty` (se era riservato) |

_*Nota: In stato RESERVED è possibile solo **aggiungere l'indirizzo di spedizione** tramite POST `/api/orders/:id/shipping`, non modificare gli items._

---

## 📦 Gestione dello Stock

Il sistema utilizza un meccanismo a due livelli per la gestione dell'inventario:

### Campi dell'Inventario

- **`available_quantity`**: Quantità fisica presente in magazzino
- **`reserved_quantity`**: Quantità già riservata da ordini in attesa di pagamento/spedizione
- **`available_to_sell`**: Quantità effettivamente acquistabile = `available_quantity - reserved_quantity`

### Momenti Chiave di Aggiornamento

| Fase | Operazione | Impatto |
|------|-----------|---------|
| **Checkout** | Riserva stock | `reserved_quantity += quantity_order` |
| **Pagamento Confermato** | Nessun cambio | Stock già riservato al checkout |
| **Spedizione Effettiva** | Decrementa stock | `available_quantity -= quantity_order`<br>`reserved_quantity -= quantity_order` |
| **Annullamento** | Libera riserva | `reserved_quantity -= quantity_order` |

### Gestione Race Conditions

La gestione delle race condition è risolta attraverso:
- **Query transazionali atomiche** durante il checkout
- **Verifica e aggiornamento** delle quantità in un'unica operazione database
- **Validazione RESERVED** che impedisce modifiche al carrello dopo la riserva

---

## 🛒 Fasi del Ciclo di Vita

### 1. Gestione Carrello Frontend

#### 🎯 Obiettivo
Il cliente costruisce il carrello completamente a frontend usando `localStorage` tramite Zustand store (`cartStore`). Nessuna interazione con il backend fino al checkout.

#### 💾 Implementazione Frontend

- **Storage**: `localStorage` per persistenza permanente (non si svuota alla chiusura del browser)
- **Struttura dati**: Array di oggetti `{productCode: string, quantity: number}`
- **Operazioni locali**: Add, update, remove, clear - tutte gestite via JavaScript
- **Visualizzazione stock**: Query API `/api/products` per mostrare disponibilità in tempo reale
- **Performance**: Zero latenza per modifiche carrello, nessun carico sul backend

#### 🔐 Autenticazione
Nessuna autenticazione richiesta per gestione carrello locale. JWT necessario solo al checkout.

#### ⚙️ Note Operative

- ✅ Nessuna chiamata API durante costruzione carrello
- ✅ Il frontend interroga `/api/products` per mostrare stock disponibile: `available_to_sell = available_quantity - reserved_quantity`
- ✅ Il carrello è completamente modificabile senza limitazioni
- ✅ Pulizia manuale con `clearCart()` che aggiorna `localStorage`
- ✅ Approccio ottimale per POC: minima complessità backend, massima reattività frontend

---

### 2. Checkout e Creazione Ordine dal Carrello (localStorage → RESERVED)

#### 🎯 Obiettivo
Creare l'ordine dal carrello frontend, validare la disponibilità dei prodotti e riservare lo stock. Questo passaggio avviene PRIMA di navigare alla pagina di checkout.

#### 🎭 Componente Frontend
**CartSidebar.tsx** - Il bottone "Checkout" nel carrello laterale

#### 📡 API Coinvolta

| Endpoint | Metodo | Descrizione |
|----------|--------|-------------|
| `/api/orders/checkout` | POST | Crea ordine dal carrello FE, valida disponibilità prodotti, riserva stock e crea ordine in stato RESERVED |

#### 📥 Input Richiesto

```json
{
  "items": [
    {
      "productCode": "LAPTOP-HP-ENVY",
      "quantity": 2
    },
    {
      "productCode": "MOUSE-LOGITECH",
      "quantity": 1
    }
  ]
}
```

#### 📤 Output - Successo Completo (Status 201 Created)

```json
{
  "success": true,
  "message": "Order created and inventory reserved successfully",
  "data": {
    "success": true,
    "orderId": 123,
    "status": "RESERVED",
    "items": [
      {
        "id": 1,
        "productCode": "LAPTOP-HP-ENVY",
        "productName": "HP Envy Laptop",
        "quantity": 2,
        "unitPrice": 899.99,
        "totalPrice": 1799.98
      }
    ],
    "totalAmount": 1899.98,
    "reservedUntil": "2026-02-09T10:30:00Z"
  }
}
```

#### 📤 Output - Prodotti Non Disponibili (Status 409 Conflict)

```json
{
  "success": false,
  "message": "Some products are not available in requested quantities",
  "data": {
    "success": false,
    "error": "Insufficient stock for some products",
    "unavailableProducts": [
      {
        "productCode": "LAPTOP-HP-ENVY",
        "requested": 5,
        "availableToSell": 2
      }
    ]
  }
}
```

#### ⚙️ Note Operative

- ✅ **Idempotenza garantita**: Prima di creare nuovo ordine, cancella automaticamente eventuali ordini RESERVED esistenti del cliente e libera il loro stock
- ✅ **Query transazionale atomica** per verificare disponibilità di tutti i prodotti in un'unica operazione
- ✅ Se tutti i prodotti sono disponibili → crea ordine RESERVED, riserva stock atomicamente, ritorna 201 Created
- ✅ Se alcuni prodotti non sono disponibili → ritorna 409 Conflict con lista prodotti mancanti, nessun ordine creato
- ✅ Validazioni: productCode valido, quantità positive intere, prodotti esistenti
- ✅ Una volta in stato `RESERVED`, l'ordine **non è più modificabile** (solo cancellabile)
- ✅ **NON** richiede indirizzo di spedizione in questa fase (si aggiunge dopo con endpoint separato)
- ✅ Autenticazione: JWT Customer richiesto

#### 🔒 Gestione Timeout

Gli ordini in stato `RESERVED` hanno un timeout (gestito da batch job):
- Default: 24 ore (configurabile tramite `RESERVED_EXPIRATION_HOURS`)
- Grace period: 10 minuti extra (configurabile tramite `CART_GRACE_PERIOD_MINUTES`)
- Se rimangono troppo tempo senza pagamento → passano a `CANCELLED` e liberano `reserved_quantity`

#### ⚠️ Workflow Frontend Implementato

**CartSidebar.tsx** (componente carrello laterale):

1. **Costruzione carrello**: Utente aggiunge prodotti in `localStorage` tramite `useCart()` hook → `cartStore` (Zustand)
2. **Click bottone "Checkout"** nel carrello laterale:
   - Se non autenticato → redirect a `/login?callbackUrl={currentUrl}&autoCheckout=true`
   - Se autenticato → chiama `createCheckoutMutation.mutateAsync(items)`
3. **POST `/api/orders/checkout`**: Backend crea ordine RESERVED e riserva stock
4. **Se successo (201)**:
   - CartSidebar riceve `orderId` dalla risposta API
   - Chiude il carrello laterale
   - Reindirizza a `/checkout?orderId={orderId}`
5. **Se fallimento (409)**:
   - Mostra dialog modale con prodotti non disponibili
   - Utente può aggiornare carrello con quantità disponibili o rimuovere prodotti
   - Chiude dialog e riprova checkout
6. **Dopo login con autoCheckout=true**:
   - Frontend esegue automaticamente il checkout senza riaprire il carrello
   - Rimuove il parametro `autoCheckout` dall'URL
   - Se il checkout fallisce, apre il carrello laterale per mostrare errori

**IMPORTANTE**: Il carrello viene svuotato solo DOPO il pagamento confermato (fase 4), non al momento della creazione ordine.

---

### 3. Aggiunta Indirizzo di Spedizione (RESERVED → RESERVED)

#### 🎯 Obiettivo
Salvare l'indirizzo di spedizione nell'ordine RESERVED già creato prima di procedere al pagamento.

#### 🎭 Componente Frontend
**CheckoutPage.tsx** → **ShippingForm.tsx** (Step 1 del checkout)

#### 📡 API Coinvolta

| Endpoint | Metodo | Descrizione |
|----------|--------|-------------|
| `/api/orders/:id/shipping` | POST | Salva l'indirizzo di spedizione nell'ordine RESERVED |

#### 📥 Input Richiesto

```json
{
  "shippingAddress": {
    "firstName": "Mario",
    "lastName": "Rossi",
    "addressLine": "Via Roma 123",
    "city": "Milano",
    "postalCode": "20121",
    "province": "MI"
  }
}
```

#### 📤 Output - Successo (Status 200 OK)

```json
{
  "success": true,
  "message": "Shipping address added successfully",
  "data": {
    "orderId": 123,
    "status": "RESERVED",
    "shippingAddress": "Via Roma 123, 20121 Milano (MI)"
  }
}
```

#### ⚙️ Note Operative

- ✅ L'ordine **deve** essere in stato `RESERVED` per accettare l'indirizzo
- ✅ L'ordine **deve** appartenere al customer autenticato (verifica via JWT)
- ✅ Validazioni:
  - `firstName`: minimo 2 caratteri
  - `lastName`: minimo 2 caratteri  
  - `addressLine`: minimo 5 caratteri
  - `city`: minimo 2 caratteri
  - `postalCode`: esattamente 5 caratteri
  - `province`: esattamente 2 caratteri (maiuscolo)
- ✅ Tutti i campi vengono normalizzati (trim, uppercase per provincia)
- ✅ L'indirizzo viene salvato come JSON nel campo `shipping_address` della tabella `customer_order`
- ✅ Lo stato dell'ordine rimane `RESERVED`
- ✅ Autenticazione: JWT Customer richiesto

#### 🔔 Workflow Frontend Implementato

**CheckoutPage.tsx** → **ShippingForm.tsx**:

1. Utente arriva su `/checkout?orderId={orderId}` dopo creazione ordine dal carrello
2. CheckoutPage legge `orderId` dai query params dell'URL
3. Se `orderId` manca → redirect automatico a `/cart`
4. `ShippingForm` (Step 1) raccoglie dati indirizzo con validazione frontend
5. Submit form → `addShippingMutation.mutateAsync()` → POST `/api/orders/:orderId/shipping`
6. Se successo:
   - Salva `shippingData` nello stato locale del componente
   - Passa automaticamente a step 2 `payment`
7. Se errore → mostra messaggio di errore all'utente senza cambiare step

---

### 4. Pagamento e Conferma (RESERVED → NEW)

#### 🎯 Obiettivo
Il cliente inizia il processo di pagamento tramite gateway esterno (Stripe, PayPal, etc.). Il backend riceve conferma dal gateway via webhook e aggiorna lo stato dell'ordine.

#### 🎭 Componente Frontend
**CheckoutPage.tsx** → **PaymentForm.tsx** (Step 2 del checkout)

#### 📡 API Coinvolte

| Endpoint | Metodo | Descrizione | Chiamante |
|----------|--------|-------------|-----------|--------|
| `/api/payments` | POST | Inizia la sessione di pagamento con il gateway esterno. Genera `transaction_id` e ritorna dati sessione | Customer (Frontend) |
| `/api/payments/webhook` | POST | Riceve conferma dal gateway esterno con status finale: `COMPLETED`, `FAILED`, o `CANCELLED` | Payment Provider (Gateway) |

#### ⚙️ Note Operative

**Inizializzazione Pagamento (Frontend → Backend → Gateway):**
- ✅ L'ordine **deve** essere in stato `RESERVED` per iniziare il pagamento
- ✅ L'ordine **deve** avere un indirizzo di spedizione salvato
- ✅ **POST `/api/payments`**: Crea la sessione di pagamento con il gateway esterno
  - Backend valida che l'ordine appartenga al customer autenticato
  - Backend chiama API del payment provider (es. Stripe, PayPal)
  - Salva `transaction_id` e `payment_provider` nell'ordine (colonne della tabella `customer_order`)
  - Ritorna al frontend: `transactionId`, `paymentProvider`, `paymentUrl`, `sessionId`, `expiresAt`
- ✅ **Frontend**: In produzione reindirizza al gateway esterno (Stripe Checkout, PayPal, etc.)
  - In questo POC, il frontend mostra modal "Elaborazione pagamento" e attende conferma via WebSocket
  - **NON simula il pagamento** - il pagamento viene confermato via webhook (vedi sotto)

**Conferma Pagamento (Gateway → Backend → WebSocket):**
- ✅ **Webhook POST `/api/payments/webhook`**: Riceve conferma asincrona dal gateway esterno
  - Verifica firma crittografica del webhook (sicurezza)
  - Trova l'ordine tramite `orderId` o `transactionId`
  - Aggiorna stato in base all'esito ricevuto
- ✅ **Pagamento annullato** (`CANCELLED`):
  - `payment_status = CANCELLED`
  - Stato ordine passa a `CANCELLED`
  - Libera `reserved_quantity` per tutti i prodotti dell'ordine
- ✅ **Pagamento fallito** (`FAILED`):
  - `payment_status = FAILED`
  - Stato ordine passa a `CANCELLED`
  - Libera `reserved_quantity`
- ✅ **Pagamento confermato** (`COMPLETED`):
  - `payment_status = COMPLETED`
  - Stato ordine passa a `NEW`
  - `reserved_quantity` resta invariato (già riservato alla fase 2)
  - Salva `payment_provider`, `transaction_id`, `payment_date`, `amount`
  - **Emette evento WebSocket `order.paid`** al cliente owner dell'ordine
  - Frontend riceve l'evento e lo gestisce localmente come `order-update`
- ✅ Da questo momento l'ordine è **ufficiale** e può essere elaborato dal backoffice
- ✅ Gestione idempotenza: webhook duplicati vengono ignorati
- ✅ Transazionalità completa: rollback automatico in caso di errore
- 🚧 **TODO**: Implementare storno automatico per pagamenti confermati ma poi annullati manualmente

#### 🔔 Notifica WebSocket

**Evento Emesso dal Backend**: `order.paid`  
**Evento Ascoltato dal Frontend**: `order-update`  
**Destinatari**: Cliente autenticato (owner dell'ordine) connesso via WebSocket

**Nota**: Il frontend ascolta eventi di tipo `order-update` tramite `usePaymentListener()` hook, anche se il backend emette `order.paid`. Questa discrepanza esiste per retrocompatibilità e potrebbe essere unificata in futuro.

**Payload Evento Backend `order.paid`**:
```json
{
  "type": "order.paid",
  "timestamp": "2026-02-08T11:15:00Z",
  "data": {
    "orderId": 123,
    "customerId": 456,
    "customerName": "Mario Rossi",
    "totalAmount": 1899.98,
    "paymentDate": "2026-02-08T11:15:00Z",
    "paymentProvider": "card",
    "transactionId": "txn_1234567890_abc123"
  }
}
```

#### 🔄 Workflow Frontend Implementato

**CheckoutPage.tsx** → **PaymentForm.tsx** → **usePaymentListener()** hook:

1. Utente completa form pagamento (Step 2) e clicca "Paga Ora"
2. Frontend salva `paymentMethod` nello stato locale
3. Frontend chiama `initiatePaymentMutation.mutateAsync()` → POST `/api/payments`
4. Backend valida ordine e chiama API del payment provider:
   - Verifica che ordine sia in stato `RESERVED`
   - Verifica che ordine appartenga al customer autenticato
   - Chiama API esterna del gateway (Stripe/PayPal)
   - Salva `transaction_id` nell'ordine
   - Ritorna al frontend: `transactionId`, `paymentUrl`, `sessionId`, `expiresAt`
5. Frontend mostra Dialog modale "Elaborazione Pagamento":
   - Spinner animato e messaggio di attesa
   - In development: mostra `orderId` e `transactionId` per testing
   - In development: bottone "🧪 Simula Pagamento" che apre `orders.html` in nuova tab
   - Bottone "Annulla" per chiudere modal (con conferma)
6. Hook `usePaymentListener()` si attiva e ascolta eventi WebSocket:
   - Registra listener per eventi di tipo `order-update`
   - Filtra eventi per `orderId` corrente
   - Attende conferma pagamento dal backend
7. **Flusso asincrono parallelo** (Gateway → Backend):
   - Cliente completa pagamento sul sito del gateway esterno
   - Gateway chiama webhook POST `/api/payments/webhook`
   - Backend aggiorna ordine da `RESERVED` a `NEW` (se COMPLETED)
   - Backend emette evento WebSocket `order.paid` al cliente
8. Frontend riceve evento tramite `usePaymentListener()`:
   - Verifica che `data.orderId` corrisponda all'ordine corrente
   - Chiude modal "Elaborazione Pagamento"
   - Crea oggetto `completedOrder` con dati ricevuti
   - Cambia step a `confirmation`
   - **Svuota il carrello** con `clearCart()`
   - Mostra componente `OrderConfirmation` con riepilogo ordine
9. In caso di timeout o errore (solo in development):
   - Frontend mostra bottone per aprire `orders.html` in nuova tab
   - Operatore può simulare manualmente il webhook pagamento
   - Utile per testing senza configurare gateway reale

**Test Tool (Solo Development)**:
- File `backend/src/pages/orders.html` fornisce interfaccia per simulare webhook
- Accessibile da `/user-interface` del backend
- Permette di testare tutti gli stati del ciclo ordine senza integrazioni reali

---

### 5. Elaborazione Ordine (NEW → PROCESSING)

#### 🎯 Obiettivo
L'ordine viene preso in carico da un operatore del backoffice per verifica magazzino, picking e preparazione spedizione.

#### 🎭 Interfaccia Operatore
**orders.html** - Pagina di test accessibile da `/user-interface` (solo localhost)

#### 🔐 Autenticazione
Solo **users** (operatori backoffice) con JWT + middleware `domainRestriction` (localhost only).

#### 📡 API Coinvolte

| Endpoint | Metodo | Descrizione |
|----------|--------|-------------|
| `/api/orders/:id/process` | PATCH | Aggiorna stato da NEW a PROCESSING e assegna l'ordine all'utente che lo prende in carico (campo `managed_by`) |
| `/api/orders/:id` | GET | Consultazione dello stato corrente e dettaglio ordine (accessibile anche da customers per i propri ordini) |

#### ⚙️ Note Operative

- ✅ Nessuna modifica al magazzino in questa fase
- ✅ Il campo `managed_by` (nella tabella `customer_order`) viene valorizzato con l'ID dell'utente tecnico che prende in carico l'ordine
- ✅ Solo ordini in stato `NEW` possono essere presi in carico
- ✅ Transizione di stato atomica gestita con transazione database
- ✅ In produzione: integrazione con sistemi interni di backoffice (WMS, ERP)
- ✅ In development: gestione manuale tramite `orders.html`

#### 🔔 Notifica WebSocket
**NON implementata** - Le notifiche WebSocket per ordini sono inviate solo ai clienti (customers), non agli utenti tecnici (users) del backoffice.

#### 🧪 Test con orders.html
1. Accedi a `http://localhost:3000/user-interface` (richiede login user)
2. Nella sezione "📦 Gestione Ordini", inserisci Order ID
3. Completa webhook pagamento con status `COMPLETED` (ordine passa a NEW)
4. Clicca "📋 Elabora Ordine" (ordine passa a PROCESSING)
5. Il progress indicator mostra il completamento dello step "Elaborazione"

---

### 6. Creazione Spedizione (PROCESSING → SHIPPING)

#### 🎯 Obiettivo
Creare la spedizione con il corriere esterno e ottenere il tracking code. L'ordine passa da PROCESSING a SHIPPING.

#### 🎭 Interfaccia Operatore
**orders.html** - Sezione "🚚 Crea Spedizione"

#### 📡 API Coinvolta

| Endpoint | Metodo | Descrizione |
|----------|--------|-------------|
| `/api/orders/:id/ship` | POST | Crea la spedizione con il corriere specificato. Genera automaticamente `tracking_code` e `shipment_date`. Passa ordine da PROCESSING a SHIPPING |

#### 📥 Input Richiesto

```json
{
  "carrier": "DHL"
}
```

**Carriers supportati**: `DHL`, `UPS`, `FedEx`, `BRT`, `GLS` (vedi dropdown in `orders.html`)

#### 📤 Output - Successo (Status 201 Created)

```json
{
  "success": true,
  "message": "Shipment created successfully",
  "data": {
    "orderId": 123,
    "orderStatus": "SHIPPING",
    "shipment": {
      "id": 456,
      "trackingCode": "TRK1234567890",
      "carrier": "DHL",
      "shipmentDate": "2026-02-23T10:30:00Z",
      "status": "PENDING"
    }
  }
}
```

#### ⚙️ Note Operative

- ✅ Solo ordini in stato `PROCESSING` possono creare spedizione
- ✅ In produzione: chiamata API esterna del corriere per creare spedizione reale
- ✅ In development/POC: genera `tracking_code` simulato (formato `TRK` + timestamp + random)
- ✅ Ricezione automatica di `shipment_id`, `tracking_code`, `label_url` (in produzione)
- ✅ Salvataggio dati nella tabella `shipment` (MySQL)
- ✅ Stato ordine passa atomicamente da `PROCESSING` a `SHIPPING`
- ✅ **Nessuna modifica al magazzino** (prodotti ancora fisicamente in magazzino)
- ✅ Il campo `carrier` viene normalizzato in uppercase
- ✅ Autenticazione: JWT User + `domainRestriction` middleware (localhost only)

#### 🧪 Test con orders.html
1. Completa la fase 5 (ordine in stato PROCESSING)
2. Nella sezione "🚚 Crea Spedizione", seleziona un corriere dal dropdown
3. Clicca "🚚 Crea Spedizione"
4. Backend genera `tracking_code` automaticamente
5. Salva il `tracking_code` mostrato - servirà per la fase 8 (webhook corriere)
6. Progress indicator mostra completamento dello step "Preparazione"

---

### 7. Conferma Spedizione (SHIPPING → SHIPPED)

#### 🎯 Obiettivo
Confermare che il pacco è stato consegnato fisicamente al corriere. **In questa fase lo stock viene decrementato definitivamente**.

#### 🎭 Interfaccia Operatore
**orders.html** - Sezione "✈️ Conferma Spedizione"

#### 📡 API Coinvolta

| Endpoint | Metodo | Descrizione |
|----------|--------|-------------|
| `/api/orders/:id/ship/sent` | PATCH | Conferma consegna fisica al corriere. Passa ordine da SHIPPING a SHIPPED e decrementa stock |

#### 📥 Input Richiesto

```json
{
  "actualShippingDate": "2026-02-23T14:30:00Z"  // Opzionale
}
```

**Nota**: Se `actualShippingDate` non viene fornito, il sistema usa la data/ora corrente.

#### 📤 Output - Successo (Status 200 OK)

```json
{
  "success": true,
  "message": "Shipment marked as sent successfully",
  "data": {
    "orderId": 123,
    "orderStatus": "SHIPPED",
    "shipment": {
      "id": 456,
      "status": "SHIPPED",
      "actualShippingDate": "2026-02-23T14:30:00Z"
    },
    "stockUpdated": true
  }
}
```

#### ⚙️ Note Operative

- ✅ Solo ordini in stato `SHIPPING` (con spedizione già creata) possono essere marcati come spediti
- ✅ Conferma che il pacco è stato consegnato fisicamente al corriere
- ✅ **MOMENTO CRITICO - Aggiornamento definitivo del magazzino** (transazione atomica):
  - `available_quantity -= quantity_ordered` (per ogni prodotto dell'ordine)
  - `reserved_quantity -= quantity_ordered` (libera la riserva)
  - Aggiornamento tabella `product` per ogni item dell'ordine
- ✅ Stato ordine passa atomicamente da `SHIPPING` a `SHIPPED`
- ✅ Stato spedizione nella tabella `shipment` passa a `SHIPPED`
- ✅ Salva `actual_shipping_date` nella tabella `shipment`
- ✅ Ordine ora completamente tracciabile dal cliente
- ✅ Rollback completo in caso di errore (protezione integrità stock)
- ✅ Autenticazione: JWT User + `domainRestriction` middleware (localhost only)

#### 📡 API Aggiuntiva per Consultazione

| Endpoint | Metodo | Descrizione |
|----------|--------|-------------|
| `/api/shipments` | GET | Recupera spedizioni con filtri (orderId, customerId, trackingCode, carrier, status) |

**Query params**: `?orderId=123&status=SHIPPED&page=1&limit=50`

#### 🔔 Notifica WebSocket
**NON implementata** - Le notifiche WebSocket per ordini sono inviate solo ai clienti (customers), non agli utenti tecnici (users) del backoffice.

#### 🧪 Test con orders.html
1. Completa la fase 6 (ordine in stato SHIPPING con spedizione creata)
2. Nella sezione "✈️ Conferma Spedizione", clicca "✈️ Conferma Spedizione"
3. Backend decrementa stock di tutti i prodotti nell'ordine
4. Ordine passa a stato SHIPPED
5. Progress indicator mostra completamento dello step "Spedizione"

---

### 8. Aggiornamenti Tracking e Consegna (SHIPPED → DELIVERED)

#### 🎯 Obiettivo
Il corriere invia aggiornamenti sullo stato della spedizione fino alla consegna finale. Il cliente può tracciare il pacco.

#### 🎭 Interfaccia Test
**orders.html** - Sezione "📡 Simula Webhook Corriere"

#### 📡 API Coinvolta

| Endpoint | Metodo | Descrizione | Chiamante |
|----------|--------|-------------|-----------|--------|
| `/api/shipments/webhook` | POST | Riceve aggiornamenti di tracking dal corriere esterno. Aggiorna stato spedizione e ordine | Shipping Provider (Gateway) |

#### 📥 Input Richiesto

```json
{
  "trackingCode": "TRK1234567890",
  "status": "DELIVERED",
  "timestamp": "2026-02-25T16:45:00Z",
  "location": "Milano, IT"  // Opzionale
}
```

**Stati validi**: `IN_TRANSIT`, `OUT_FOR_DELIVERY`, `DELIVERED`, `FAILED`

#### 📤 Output - Successo (Status 200 OK)

```json
{
  "success": true,
  "message": "Shipment webhook processed successfully",
  "data": {
    "received": true,
    "processed": true,
    "trackingCode": "TRK1234567890",
    "status": "DELIVERED"
  }
}
```

#### ⚙️ Note Operative

**Gestione Stati Tracking**:
- ✅ **IN_TRANSIT**: Pacco in transito presso hub del corriere
  - Aggiorna stato spedizione a `IN_TRANSIT`
  - Ordine resta in stato `SHIPPED`
  - Salva `location` e `timestamp` se forniti
- ✅ **OUT_FOR_DELIVERY**: Pacco sul furgone per consegna
  - Aggiorna stato spedizione a `OUT_FOR_DELIVERY`
  - Ordine resta in stato `SHIPPED`
  - Salva `location` e `timestamp` se forniti
- ✅ **DELIVERED**: Pacco consegnato al destinatario
  - Aggiorna stato spedizione a `DELIVERED`
  - **Ordine passa da SHIPPED a DELIVERED** (stato finale)
  - Salva `delivered_at` timestamp
  - Salva `location` come indirizzo di consegna confermato
- ✅ **FAILED**: Consegna fallita (destinatario assente, indirizzo errato, etc.)
  - Aggiorna stato spedizione a `FAILED`
  - Ordine resta in stato `SHIPPED` (richiede intervento manuale)
  - Salva note di fallimento

**Sicurezza e Validazione**:
- ✅ Verifica firma crittografica HMAC del webhook (produzione)
- ✅ Verifica timestamp per prevenire replay attacks
- ✅ Idempotenza: webhook duplicati vengono ignorati
- ✅ Solo `trackingCode` e `status` sono obbligatori
- ✅ Transazionalità: rollback in caso di errore
- ✅ Nessun impatto sul magazzino (già aggiornato alla fase 7)

**Integrazioni**:
- ✅ In produzione: webhook ricevuto automaticamente da DHL, UPS, FedEx, GLS, BRT
- ✅ In development: simulato manualmente tramite `orders.html`
- 🚧 **TODO**: Notifiche email/push al cliente per aggiornamenti tracking
- 🚧 **TODO**: Integrazione con sistema di feedback post-consegna

#### 🔔 Notifiche WebSocket
**NON implementata** - Le notifiche WebSocket per aggiornamenti tracking/consegna non sono attualmente implementate. I clienti devono ricaricare la pagina ordini per vedere aggiornamenti.

#### 🧪 Test con orders.html
1. Completa la fase 7 (ordine in stato SHIPPED)
2. Il `tracking_code` è pre-compilato dalla fase 6
3. Nella sezione "📡 Simula Webhook Corriere":
   - Seleziona status `IN_TRANSIT` → invia webhook → verifica stato spedizione
   - Seleziona status `OUT_FOR_DELIVERY` → invia webhook → pacco in consegna
   - Seleziona status `DELIVERED` → invia webhook → ordine passa a DELIVERED
4. Progress indicator mostra completamento dello step "Tracking"
5. Ordine è ora completato con successo

---

### 9. Annullamento Ordine (→ CANCELLED)

#### 🎯 Obiettivo
Annullare un ordine prima della spedizione e liberare lo stock riservato.

#### 🎭 Interfaccia Test
**orders.html** - Sezione "💳 Simula Webhook Pagamento" con status `CANCELLED`

#### 📡 API Coinvolta

| Endpoint | Metodo | Descrizione |
|----------|--------|-------------|
| `/api/payments/webhook` | POST | Webhook pagamento con status `CANCELLED` annulla l'ordine e libera stock riservato |

#### 📥 Input Richiesto

```json
{
  "orderId": 123,
  "transactionId": "txn_1234567890_abc123",
  "status": "CANCELLED",
  "timestamp": "2026-02-23T11:00:00Z"
}
```

#### 📤 Output - Successo (Status 200 OK)

```json
{
  "success": true,
  "message": "Payment webhook processed successfully",
  "data": {
    "received": true,
    "processed": true,
    "orderId": 123,
    "status": "CANCELLED"
  }
}
```

#### ⚙️ Note Operative

**Metodi di Annullamento**:
- ✅ **Via webhook pagamento**: L'unico metodo attualmente implementato
  - Cliente annulla pagamento sul gateway esterno (Stripe, PayPal)
  - Gateway invia webhook con status `CANCELLED`
  - Backend processa webhook e annulla ordine
- ❌ **Endpoint dedicato NON ESISTE**: Non c'è `/api/orders/:id/cancel` per annullamenti manuali

**Comportamento per Status CANCELLED**:
- ✅ Trova ordine tramite `orderId` o `transactionId`
- ✅ Aggiorna `payment_status = CANCELLED` nella tabella `customer_order`
- ✅ Aggiorna `status = CANCELLED` nella tabella `customer_order`
- ✅ **Libera stock riservato** (transazione atomica):
  - `reserved_quantity -= quantity_order` per ogni prodotto
  - Solo se ordine era in stato `RESERVED` o `NEW`
- ✅ Salva timestamp annullamento

**Restrizioni Stato**:
- ✅ **Può essere annullato**: Ordini in stato `RESERVED` o `NEW`
- ❌ **NON può essere annullato**: Ordini già in `PROCESSING`, `SHIPPING`, `SHIPPED`, o `DELIVERED`
- ⚠️  Se webhook CANCELLED arriva per ordine già processato → viene loggato ma non annulla ordine

**Limitazioni Attuali**:
- 🚧 **TODO**: Implementare endpoint `/api/orders/:id/cancel` per annullamenti manuali da backoffice
- 🚧 **TODO**: Gestire annullamenti post-pagamento con storno automatico tramite gateway
- 🚧 **TODO**: Permettere annullamento di ordini in PROCESSING (con workflow di approvazione)

#### 🔔 Notifica WebSocket
**NON implementata** - Nessuna notifica WebSocket viene inviata per annullamenti ordine.

#### 🧪 Test con orders.html
1. Crea ordine RESERVED tramite checkout frontend
2. In `orders.html`, nella sezione "💳 Simula Webhook Pagamento":
   - Inserisci Order ID e Transaction ID
   - Seleziona status `CANCELLED`
   - Clicca "Invia Webhook Pagamento"
3. Backend annulla ordine e libera stock riservato
4. Verifica che `reserved_quantity` sia stata decrementata per i prodotti

---

### 10. Consultazione e Reportistica

#### 📡 API Disponibili

| Endpoint | Metodo | Descrizione | Accesso |
|----------|--------|-------------|---------|
| `/api/orders/search` | GET | Ricerca ordini con filtri avanzati per stato, cliente, date, importi | Users + Customers |
| `/api/orders/:id` | GET | Dettaglio completo di un ordine specifico | Users + Customers |

#### ⚙️ Note Operative

- ✅ Solo ordini con stato `RESERVED` o successivi sono persistiti sul database
- ✅ I carrelli frontend (`localStorage`) non esistono lato backend
- ✅ Filtri disponibili: stato, data creazione, data aggiornamento, cliente, range importi
- ✅ Paginazione implementata per performance su grandi volumi

---

## 📋 Riepilogo Flusso Completo

| Fase | Stato Iniziale | Stato Finale | API Principali | Azioni Database |
|------|----------------|--------------|----------------|-----------------|
| **Gestione carrello** | – | localStorage | Nessuna (solo localStorage FE) | Nessuna (non esiste nel DB) |
| **Checkout** | localStorage | RESERVED | POST `/api/orders/checkout` | Crea ordine + items<br>`reserved_quantity += qty` |
| **Aggiunta indirizzo** | RESERVED | RESERVED | POST `/api/orders/:id/shipping` | Salva JSON indirizzo in `shipping_address` |
| **Inizio pagamento** | RESERVED | RESERVED | POST `/api/payments` | Salva `transaction_id` e `payment_provider` |
| **Conferma pagamento** | RESERVED | NEW | POST `/api/payments/webhook`<br>(status=COMPLETED) | Aggiorna `payment_status` e `status`<br>Emette evento WebSocket |
| **Elaborazione** | NEW | PROCESSING | PATCH `/api/orders/:id/process` | `managed_by = user_id` |
| **Creazione spedizione** | PROCESSING | SHIPPING | POST `/api/orders/:id/ship` | Crea record spedizione<br>Genera `tracking_code` |
| **Conferma spedizione** | SHIPPING | SHIPPED | PATCH `/api/orders/:id/ship/sent` | **Decrementa stock**:<br>`available_quantity -= qty`<br>`reserved_quantity -= qty` |
| **Tracking updates** | SHIPPED | SHIPPED | POST `/api/shipments/webhook`<br>(IN_TRANSIT, OUT_FOR_DELIVERY) | Aggiorna stato spedizione |
| **Consegna** | SHIPPED | DELIVERED | POST `/api/shipments/webhook`<br>(status=DELIVERED) | Aggiorna `delivered_at`<br>Status finale |
| **Annullamento** | RESERVED/NEW | CANCELLED | POST `/api/payments/webhook`<br>(status=CANCELLED) | `reserved_quantity -= qty` |

---

## 🧪 Test Tool: orders.html

### 📄 Overview

Il file `backend/src/pages/orders.html` è un'interfaccia web per **testare e simulare** tutte le operazioni del ciclo di vita degli ordini senza necessità di integrazioni reali con payment gateway e corrieri esterni.

**Scopo**: Tool di sviluppo e testing per operatori backoffice

**Accesso**: `http://localhost:3000/user-interface` (richiede autenticazione User + localhost)

**Percorso file**: `backend/src/pages/orders.html`

### 🎯 Funzionalità Principali

#### 1️⃣ Progress Indicator Visuale

Mostra lo stato corrente dell'ordine attraverso 5 step visuali:
- 💳 **Pagamento** (RESERVED → NEW)
- 📋 **Elaborazione** (NEW → PROCESSING)
- 🚚 **Preparazione** (PROCESSING → SHIPPING)
- ✈️ **Spedizione** (SHIPPING → SHIPPED)
- 📡 **Tracking** (SHIPPED → DELIVERED)

Ogni step viene evidenziato e marcato come completato man mano che l'ordine avanza nel ciclo di vita.

#### 2️⃣ Sezione: Simula Webhook Pagamento

**Input**:
- Order ID (numero ordine da testare)
- Transaction ID (ID transazione pagamento)
- Status: `COMPLETED` / `FAILED` / `CANCELLED`

**API chiamata**: `POST /api/payments/webhook`

**Utilizzo**:
1. Cliente completa checkout su frontend → ottiene Order ID
2. Operatore inserisce Order ID e Transaction ID in orders.html
3. Seleziona status desiderato (COMPLETED per successo)
4. Backend processa webhook → ordine passa da RESERVED a NEW
5. Frontend riceve notifica WebSocket e completa processo checkout

**Nota**: Simula il comportamento di Stripe/PayPal che inviano webhook al completamento pagamento.

#### 3️⃣ Sezione: Elabora Ordine

**Input**: Usa Order ID già inserito nella sezione precedente

**API chiamata**: `PATCH /api/orders/:id/process`

**Utilizzo**:
1. Ordine deve essere in stato NEW (pagamento confermato)
2. Click "📋 Elabora Ordine"
3. Backend assegna ordine all'operatore (`managed_by`)
4. Ordine passa a PROCESSING

**Nota**: Simula presa in carico da parte del magazzino/backoffice.

#### 4️⃣ Sezione: Crea Spedizione

**Input**:
- Order ID (già presente)
- Corriere: DHL / UPS / FedEx / BRT / GLS (dropdown)

**API chiamata**: `POST /api/orders/:id/ship`

**Output**: 
- Tracking Code generato automaticamente (es. `TRK1234567890`)
- Salvato per uso nelle sezioni successive

**Utilizzo**:
1. Ordine deve essere in stato PROCESSING
2. Seleziona corriere dal dropdown
3. Click "🚚 Crea Spedizione"
4. Backend genera tracking code automaticamente
5. Ordine passa a SHIPPING
6. **Salva il tracking code mostrato** - servirà per sezione 5

**Nota**: In produzione chiamerebbe API reale del corriere (DHL API, UPS API, etc.)

#### 5️⃣ Sezione: Conferma Spedizione

**Input**: Order ID (già presente)

**API chiamata**: `PATCH /api/orders/:id/ship/sent`

**Utilizzo**:
1. Ordine deve essere in stato SHIPPING (con spedizione creata)
2. Click "✈️ Conferma Spedizione"
3. **MOMENTO CRITICO**: Backend decrementa definitivamente lo stock
   - `available_quantity -= qty`
   - `reserved_quantity -= qty`
4. Ordine passa a SHIPPED

**Nota**: Simula consegna fisica del pacco al corriere.

#### 6️⃣ Sezione: Simula Webhook Corriere

**Input**:
- Tracking Code (pre-compilato dalla sezione 4)
- Status: `IN_TRANSIT` / `OUT_FOR_DELIVERY` / `DELIVERED` / `FAILED`
- Location (opzionale): es. "Milano, IT"
- Timestamp (opzionale): data/ora aggiornamento

**API chiamata**: `POST /api/shipments/webhook`

**Utilizzo**:
1. Ordine deve essere in stato SHIPPED
2. Tracking code è già compilato automaticamente
3. Seleziona status progressivo:
   - `IN_TRANSIT` → pacco in transito
   - `OUT_FOR_DELIVERY` → pacco in consegna
   - `DELIVERED` → pacco consegnato (**ordine passa a DELIVERED**)
   - `FAILED` → consegna fallita
4. Click "📡 Invia Webhook Corriere"
5. Backend aggiorna stato spedizione
6. Se DELIVERED → ordine completato (stato finale)

**Nota**: Simula aggiornamenti inviati da DHL/UPS/FedEx durante il tracking.

### 🎨 Caratteristiche UI

**Design**:
- Interfaccia moderna con gradiente viola
- Icone emoji per identificazione rapida sezioni
- Progress bar con animazioni
- Color coding per stati (verde=successo, rosso=errore, giallo=warning)

**Validazioni**:
- Campi obbligatori evidenziati
- Validazione lunghezza/formato input
- Feedback visuale per ogni azione

**Feedback**:
- Spinner animato durante chiamate API
- Risultati formattati JSON con syntax highlighting
- Messaggi di successo/errore chiari

### 🔒 Sicurezza

**Autenticazione richiesta**:
- JWT User (operatori backoffice)
- Middleware `domainRestriction` (solo localhost:3000)

**Limitazioni**:
- Non accessibile da clienti finali (customers)
- Non accessibile da produzione/domini esterni
- Solo per ambiente development/testing

### 💡 Workflow Completo di Test

**Scenario**: Testare ciclo ordine completo end-to-end

1. **Frontend**: Cliente crea carrello → Checkout → Login
2. **Frontend**: POST `/api/orders/checkout` → riceve Order ID (es. 123)
3. **Frontend**: Aggiunge indirizzo spedizione
4. **Frontend**: Avvia pagamento → mostra modal "Elaborazione..."
5. **orders.html**: Apri `http://localhost:3000/user-interface`
6. **orders.html**: Sezione Pagamento → Order ID: 123, Transaction ID: txn_test_123, Status: COMPLETED → Invia
7. **Frontend**: Riceve WebSocket → checkout completato → carrello svuotato
8. **orders.html**: Sezione Elaborazione → Elabora Ordine
9. **orders.html**: Sezione Spedizione → Corriere: DHL → Crea Spedizione → Salva tracking code
10. **orders.html**: Sezione Conferma → Conferma Spedizione (stock decrementato)
11. **orders.html**: Sezione Webhook Corriere → Status: DELIVERED → Ordine completato

**Tempo necessario**: ~2 minuti per ciclo completo

### 📝 Note di Implementazione

**Tecnologie**:
- HTML5 + CSS3 vanilla (no framework)
- JavaScript vanilla con fetch API
- Integrazione con backend Express.js

**File correlati**:
- `backend/src/pages/orders.html` - UI principale
- `backend/src/routes/userInterfaceRoutes.ts` - Route Express
- `backend/src/controllers/PaymentController.ts` - Gestisce webhook pagamenti
- `backend/src/controllers/OrderController.ts` - Gestisce operazioni ordini
- `backend/src/controllers/ShipmentController.ts` - Gestisce webhook corrieri

**Limiti attuali**:
- Solo una pagina HTML (no SPA)
- Nessun state management persistente
- Dati ordine non caricati automaticamente (inserimento manuale ID)
- 🚧 **TODO**: Aggiungere lista ordini esistenti con dropdown
- 🚧 **TODO**: Salvare ultimo Order ID testato in localStorage
- 🚧 **TODO**: Aggiungere sezione "History" con log azioni eseguite

---

## 🔔 Notifiche Real-Time WebSocket

Il sistema genera eventi WebSocket per notificare i clienti di aggiornamenti critici sugli ordini:

| Evento Backend | Evento Ascoltato FE | Quando | Destinatari | Payload |
|----------------|---------------------|--------|-------------|---------|
| `order.paid` | `order-update` | Ordine passa da RESERVED a NEW dopo conferma pagamento | Cliente owner dell'ordine | Order ID, Customer ID, Total Amount, Payment Data |

### Implementazione

**Backend (WebSocket Server)**:
- ✅ Connessione WebSocket persistente per customers autenticati tramite JWT
- ✅ Emette evento `order.paid` quando webhook pagamento conferma status `COMPLETED`
- ✅ Evento inviato solo al cliente proprietario dell'ordine (filtro per `customerId`)
- ✅ Gestione automatica disconnessioni e riconnessioni

**Frontend (WebSocket Client)**:
- ✅ Hook `usePaymentListener()` in `hooks/useCheckout.ts`
- ✅ Ascolta eventi di tipo `order-update` (nome event listener locale)
- ✅ Filtra eventi per `orderId` corrente
- ✅ Callback `onPaymentComplete()` eseguito alla ricezione evento
- ✅ Reconnection automatica gestita da `websocketManager`

**Nota Tecnica**: Il backend emette `order.paid` ma il frontend ascolta `order-update`. Questa discrepanza esiste per retrocompatibilità/flessibilità futura e potrebbe essere unificata.

**Limitazioni Attuali**:
- ❌ **NON implementate** notifiche per utenti tecnici backoffice (users)
- ❌ **NON implementate** notifiche per altri eventi lifecycle (processing, shipping, delivered, cancelled)
- ❌ **NON implementate** notifiche per aggiornamenti tracking spedizione
- 🚧 **TODO**: Implementare notifiche email/push per eventi critici
- 🚧 **TODO**: Estendere WebSocket a tutti gli eventi del ciclo ordine

### Esempio Payload Evento Backend `order.paid`

```json
{
  "type": "order.paid",
  "timestamp": "2026-02-23T11:15:00Z",
  "data": {
    "orderId": 123,
    "customerId": 456,
    "customerName": "Mario Rossi",
    "totalAmount": 1899.98,
    "paymentDate": "2026-02-23T11:15:00Z",
    "paymentProvider": "card",
    "transactionId": "txn_1234567890_abc123"
  }
}
```

### Utilizzo nel Frontend

```typescript
// In CheckoutPage.tsx
usePaymentListener(
  orderId,
  (data) => {
    // Callback eseguito quando pagamento confermato
    setCompletedOrder(data);
    setCurrentStep('confirmation');
    clearCart();
  },
  isPaymentProcessing // Abilita listener solo durante elaborazione pagamento
);
```

---

## 🌐 Integrazioni con Sistemi Esterni

### 💳 Integrazione Pagamenti

Il sistema supporta l'integrazione con provider di pagamento esterni (Stripe, PayPal, Nexi, etc.).

#### 🔹 Flusso Outbound (Backend → Payment Provider)

**Quando**: Il cliente conferma il carrello e inizia il pagamento

**Processo**:

1. Cliente chiama POST `/api/payments` con `orderId`
2. Backend chiama API del provider:
   ```http
   POST https://api.stripe.com/v1/checkout/sessions
   Content-Type: application/json
   Authorization: Bearer sk_test_...
   
   {
     "amount": 15000,
     "currency": "eur",
     "success_url": "https://zenithstore.marketplace/success",
     "cancel_url": "https://zenithstore.marketplace/cancel"
   }
   ```
3. Provider risponde con:
   ```json
   {
     "id": "cs_test_abc123",
     "url": "https://checkout.stripe.com/pay/cs_test_abc123"
   }
   ```
4. Backend salva `transaction_id` nell'ordine
5. Frontend reindirizza il cliente all'URL di pagamento

#### 🔹 Flusso Inbound (Payment Provider → Backend)

**Quando**: Il cliente completa il pagamento sul sito del provider

**Processo**:

1. Provider chiama webhook:
   ```http
   POST /api/payments/webhook
   Content-Type: application/json
   Stripe-Signature: t=1234567890,v1=abc123...
   
   {
     "type": "checkout.session.completed",
     "data": {
       "object": {
         "id": "cs_test_abc123",
         "payment_status": "paid",
         "amount_total": 15000
       }
     }
   }
   ```
2. Backend verifica la firma del webhook (sicurezza)
3. Se pagamento confermato (`paid`):
   - `payment_status = COMPLETED`
   - `customer_order.status = NEW`
   - Salva `payment_date`
4. Risponde con `200 OK`

#### 🔒 Sicurezza Webhook Pagamenti

```typescript
// Esempio per Stripe
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

app.post('/api/payments/webhook', 
  express.raw({type: 'application/json'}), 
  async (req, res) => {
    const sig = req.headers['stripe-signature'];
    let event;

    try {
      // Verifica firma webhook
      event = stripe.webhooks.constructEvent(
        req.body,
        sig,
        process.env.STRIPE_WEBHOOK_SECRET!
      );
    } catch (err) {
      console.error(`Webhook signature verification failed:`, err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // Elabora evento verificato
    await handlePaymentWebhook(event);
    res.json({received: true});
  }
);
```

**Misure di Sicurezza**:
- ✅ Verifica firma crittografica (HMAC SHA256)
- ✅ Verifica timestamp per prevenire replay attacks
- ✅ Webhook secret configurato nel provider
- ✅ HTTPS obbligatorio per endpoint webhook

---

### 📦 Integrazione Spedizioni

Il sistema supporta l'integrazione con corrieri (DHL, UPS, GLS, BRT, etc.).

#### 🔹 Flusso Outbound (Backend → Shipping Provider)

**Quando**: L'ordine passa a PROCESSING e viene creata la spedizione

**Processo**:

1. Operatore chiama POST `/api/orders/:id/ship`
2. Backend chiama API del corriere:
   ```http
   POST https://api.corriere.it/v1/shipments
   Content-Type: application/json
   Authorization: Bearer token_corriere
   
   {
     "reference": "ORD-12345",
     "recipient": {
       "name": "Mario Rossi",
       "address": "Via Roma 123",
       "city": "Milano",
       "postalCode": "20121",
       "country": "IT"
     },
     "parcel": {
       "weight": 2.5,
       "length": 30,
       "width": 20,
       "height": 15
     }
   }
   ```
3. Corriere risponde con:
   ```json
   {
     "shipment_id": "SHP987654321",
     "tracking_code": "TRK123456789",
     "carrier": "DHL",
     "label_url": "https://dhl.com/label/abc123.pdf"
   }
   ```
4. Backend salva tutto nella tabella `shipment`
5. Ordine passa a stato `SHIPPING`

#### 🔹 Flusso Inbound (Shipping Provider → Backend)

**Quando**: Il corriere aggiorna lo stato della spedizione

**Processo**:

1. Corriere chiama webhook:
   ```http
   POST /api/shipments/webhook
   Content-Type: application/json
   X-Carrier-Signature: abc123...
   X-Timestamp: 1637145600
   
   {
     "shipment_id": "SHP987654321",
     "status": "DELIVERED",
     "timestamp": "2025-11-21T10:45:00Z",
     "location": "Milano, IT"
   }
   ```
2. Backend verifica autenticità (signature + timestamp)
3. Aggiorna stato:
   - `shipment.status = DELIVERED`
   - `customer_order.status = DELIVERED`
4. Invia notifica WebSocket
5. Risponde con `200 OK`

#### 🔒 Sicurezza Webhook Spedizioni

```typescript
import crypto from 'crypto';

app.post('/api/shipments/webhook', async (req, res) => {
  // 1. Verifica IP whitelist
  const allowedIPs = process.env.CARRIER_IPS!.split(',');
  if (!allowedIPs.includes(req.ip)) {
    return res.status(403).json({error: 'IP not allowed'});
  }

  // 2. Verifica signature
  const receivedSignature = req.headers['x-carrier-signature'];
  const expectedSignature = crypto
    .createHmac('sha256', process.env.CARRIER_WEBHOOK_SECRET!)
    .update(JSON.stringify(req.body))
    .digest('hex');

  if (receivedSignature !== expectedSignature) {
    return res.status(401).json({error: 'Invalid signature'});
  }

  // 3. Verifica timestamp (max 5 minuti di differenza)
  const timestamp = parseInt(req.headers['x-timestamp'] as string);
  const now = Math.floor(Date.now() / 1000);
  if (Math.abs(now - timestamp) > 300) {
    return res.status(401).json({error: 'Request too old'});
  }

  // 4. Elabora webhook verificato
  await handleShipmentWebhook(req.body);
  res.json({received: true});
});
```

**Misure di Sicurezza**:
- ✅ IP whitelist dei server del corriere
- ✅ Verifica signature HMAC SHA256
- ✅ Verifica timestamp contro replay attacks
- ✅ Webhook secret condiviso con il corriere
- ✅ HTTPS obbligatorio

---

## 🛡️ Sicurezza e Best Practices

### 🔐 Autenticazione e Autorizzazione

#### Middleware Stack

```typescript
// Users (backoffice operators)
router.post('/admin-endpoint', 
  corsMiddleware,           // CORS per localhost
  domainRestriction,        // Solo localhost
  authenticateTokenUser,    // JWT validation
  controller.method
);

// Customers (clienti finali)
router.post('/customer-endpoint',
  authenticateTokenCustomer, // JWT validation
  controller.method
);
```

#### Rate Limiting

Il sistema implementa rate limiting differenziato:

| Endpoint Type | Limite | Finestra |
|---------------|--------|----------|
| **Autenticazione** (login) | 5 richieste | 15 minuti |
| **API Standard** | 100 richieste | 15 minuti |
| **Webhook Esterni** | Illimitato | – |

Configurazione in `src/middleware/rateLimiter.ts`.

### 🔄 Gestione Transazionalità

Tutte le operazioni critiche utilizzano transazioni database:

```typescript
const connection = await pool.getConnection();
await connection.beginTransaction();

try {
  // 1. Verifica disponibilità
  const stock = await checkAvailability(connection, productId);
  
  // 2. Riserva stock
  await updateReservedQuantity(connection, productId, quantity);
  
  // 3. Aggiorna ordine
  await updateOrderStatus(connection, orderId, 'RESERVED');
  
  await connection.commit();
} catch (error) {
  await connection.rollback();
  throw error;
} finally {
  connection.release();
}
```

### ⚡ Gestione Errori Standardizzata

Tutti gli endpoint seguono uno schema di risposta consistente:

```typescript
// Successo
{
  "success": true,
  "message": "Operazione completata",
  "data": { ... }
}

// Errore
{
  "success": false,
  "error": "PRODUCT_NOT_AVAILABLE",
  "message": "Il prodotto richiesto non è disponibile",
  "details": {
    "productCode": "PEN123",
    "requested": 5,
    "available": 2
  }
}
```

#### Codici Errore Standard

| Codice | HTTP Status | Descrizione |
|--------|-------------|-------------|
| `AUTHENTICATION_REQUIRED` | 401 | Token JWT mancante o invalido |
| `ACCESS_DENIED` | 403 | Risorsa non accessibile dall'utente |
| `RESOURCE_NOT_FOUND` | 404 | Ordine/Prodotto non trovato |
| `PRODUCT_NOT_AVAILABLE` | 409 | Stock insufficiente |
| `ORDER_NOT_MODIFIABLE` | 409 | Ordine in stato non modificabile |
| `INVALID_STATE_TRANSITION` | 400 | Transizione di stato non valida |
| `PAYMENT_FAILED` | 402 | Pagamento non riuscito |

### 🔄 Idempotenza

I webhook sono progettati per gestire chiamate duplicate:

```typescript
async function handlePaymentWebhook(event: PaymentEvent) {
  // Verifica se l'evento è già stato processato
  const existing = await findProcessedEvent(event.id);
  if (existing) {
    console.log(`Event ${event.id} already processed, skipping`);
    return;
  }

  // Processa l'evento
  await processPayment(event);
  
  // Marca come processato
  await markEventAsProcessed(event.id);
}
```

### 🕐 Timeout Management

#### Carrelli Abbandonati (localStorage Frontend)

Non necessitano di cleanup lato backend in quanto non esistono sul server. Il cleanup è gestito manualmente dal cliente o automaticamente dal browser.

#### Ordini Riservati Non Pagati (RESERVED)

✅ **Implementato**: Batch job `CartCleanupJob` eseguito periodicamente per:
- Trovare ordini `RESERVED` non pagati oltre il timeout configurato
- Liberare `reserved_quantity` per tutti i prodotti dell'ordine
- Marcare l'ordine come `EXPIRED` (soft delete per audit)

**Configurazione** (variabili d'ambiente):
- `RESERVED_EXPIRATION_HOURS`: Tempo di attesa prima della scadenza (default: 24 ore)
- `CART_GRACE_PERIOD_MINUTES`: Periodo di grazia aggiuntivo (default: 10 minuti)

**Esempio**: Con configurazione default, un ordine RESERVED creato alle 10:00 scadrà alle 10:10 del giorno successivo.

**Scheduler**: Configurabile in `src/jobs/scheduler.ts` (default: ogni ora)

---

## 📞 Supporto e Riferimenti

Per ulteriori dettagli tecnici e risorse di sviluppo:

**Documentazione**:
- **API Documentation**: [http://localhost:3000/api/docs](http://localhost:3000/api/docs) - Swagger/OpenAPI reference
- **Setup Guide**: [SETUP.md](./SETUP.md) - Guida installazione e configurazione
- **Main README**: [README.md](../README.md) - Overview progetto completo

**Tool di Sviluppo**:
- **Test Interface**: [http://localhost:3000/user-interface](http://localhost:3000/user-interface) - Pagina di login per accesso a orders.html
- **Order Testing UI**: `backend/src/pages/orders.html` - Tool per simulare ciclo ordini completo
  - Simula webhook pagamento (Stripe/PayPal)
  - Gestisce elaborazione ordini backoffice
  - Simula webhook corrieri (DHL/UPS/FedEx)
  - Testa tracking e consegna

**File Chiave Backend**:
- `backend/src/controllers/OrderController.ts` - Gestione ordini
- `backend/src/controllers/PaymentController.ts` - Integrazione pagamenti
- `backend/src/controllers/ShipmentController.ts` - Gestione spedizioni
- `backend/src/services/OrderService.ts` - Business logic ordini
- `backend/src/jobs/CartCleanupJob.ts` - Cleanup ordini scaduti

**File Chiave Frontend**:
- `frontend/hooks/useCheckout.ts` - Hook checkout e pagamento
- `frontend/hooks/useCart.ts` - Gestione carrello localStorage
- `frontend/app/(customer)/checkout/page.tsx` - Pagina checkout
- `frontend/components/cart/CartSidebar.tsx` - Carrello laterale

**Database**:
- `documentations/ddl.sql` - Schema database MySQL
- `documentations/dml.sql` - Dati di esempio
- `documentations/mongo-init.js` - Inizializzazione MongoDB

---

© 2026 ZenithStore Online - Documentazione Tecnica
