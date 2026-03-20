# Modello ER - ZenithStore Online Database

```mermaid
erDiagram
    USER ||--o{ USER_CREDENTIAL : "has"
    USER ||--o{ PRODUCT_MASTER : "creates"
    USER ||--o{ PRODUCT_VERSION : "creates/updates/deletes"
    USER ||--o{ CATEGORY : "creates"
    USER ||--o{ INVENTORY_QUANTITY : "updates"
    
    CUSTOMER ||--o{ CUSTOMER_CREDENTIAL : "has"
    CUSTOMER ||--o{ CUSTOMER_ORDER : "places"
    CUSTOMER ||--o{ CUSTOMER_WISHLIST : "has"
    
    CATEGORY ||--o{ PRODUCT_VERSION : "classifies"
    
    PRODUCT_MASTER ||--o{ PRODUCT_VERSION : "has versions"
    PRODUCT_MASTER ||--o{ ORDER_ITEM : "referenced in"
    PRODUCT_MASTER ||--o| INVENTORY_QUANTITY : "has stock"
    PRODUCT_MASTER ||--o{ CUSTOMER_WISHLIST : "in wishlist"
    
    PRODUCT_VERSION ||--o{ ORDER_ITEM : "purchased as"
    
    CUSTOMER_ORDER ||--o{ ORDER_ITEM : "contains"
    CUSTOMER_ORDER ||--o| SHIPMENT : "has"
    CUSTOMER_ORDER ||--o{ INVENTORY_QUANTITY : "updates"
    
    USER {
        VARCHAR(15) id PK
        DATETIME start_date
        VARCHAR(100) first_name
        VARCHAR(100) last_name
        TINYINT is_active
        TINYINT is_blocked
        DATETIME end_date
    }
    
    USER_CREDENTIAL {
        BIGINT id PK
        VARCHAR(15) user_id FK
        DATETIME start_date
        VARCHAR(255) password_hash
        TINYINT is_active
        DATETIME end_date
    }
    
    CUSTOMER {
        BIGINT id PK
        DATETIME start_date
        VARCHAR(100) first_name
        VARCHAR(100) last_name
        VARCHAR(255) email UK
        TINYINT is_active
        TINYINT is_blocked
        DATETIME end_date
    }
    
    CUSTOMER_CREDENTIAL {
        BIGINT id PK
        BIGINT customer_id FK
        DATETIME start_date
        VARCHAR(255) password_hash
        TINYINT is_active
        DATETIME end_date
    }
    
    CATEGORY {
        VARCHAR(100) slug PK
        VARCHAR(100) name UK
        TEXT description
        VARCHAR(50) icon
        INT display_order
        TINYINT is_active
        DATETIME created_at
        VARCHAR(15) created_by FK
    }
    
    PRODUCT_MASTER {
        BIGINT id PK
        VARCHAR(100) product_code UK
        DATETIME created_at
        VARCHAR(15) created_by FK
    }
    
    PRODUCT_VERSION {
        BIGINT id PK
        BIGINT product_master_id FK
        VARCHAR(100) category_slug FK
        VARCHAR(255) name
        TEXT description
        DECIMAL(12-2) price
        VARCHAR(15) created_by FK
        DATETIME start_date
        VARCHAR(15) updated_by FK
        DATETIME last_update
        TINYINT is_active
        VARCHAR(15) deleted_by FK
        DATETIME end_date
        TINYINT is_current
    }
    
    CUSTOMER_ORDER {
        BIGINT id PK
        BIGINT customer_id FK
        DATETIME start_date
        VARCHAR(50) payment_provider
        VARCHAR(100) transaction_id
        ENUM payment_status
        DATETIME payment_date
        ENUM status
        VARCHAR(100) shipping_first_name
        VARCHAR(100) shipping_last_name
        VARCHAR(255) address_line
        VARCHAR(100) city
        VARCHAR(10) postal_code
        VARCHAR(100) province
        VARCHAR(15) user_id FK
        DATETIME last_update
    }
    
    ORDER_ITEM {
        BIGINT id PK
        BIGINT order_id FK
        BIGINT product_master_id FK
        BIGINT product_version_id FK
        DECIMAL(12-2) unit_price
        INT quantity
    }
    
    SHIPMENT {
        BIGINT id PK
        BIGINT order_id FK
        VARCHAR(100) carrier
        VARCHAR(200) tracking_code UK
        ENUM status
        DATETIME shipment_date
        DATETIME estimated_delivery
        DATETIME delivered_at
        VARCHAR(100) created_by
        VARCHAR(100) updated_by
        DATETIME created_at
        DATETIME last_update
    }
    
    INVENTORY_QUANTITY {
        BIGINT product_master_id PK-FK
        INT available_quantity
        INT reserved_quantity
        INT safety_stock
        VARCHAR(15) updated_by_user FK
        BIGINT updated_by_order FK
        DATETIME last_update
    }
    
    CUSTOMER_WISHLIST {
        BIGINT id PK
        BIGINT customer_id FK
        VARCHAR(100) product_code FK
        DATETIME added_at
    }
    
    JWT_BLACKLIST {
        VARCHAR(255) token_jti PK
        VARCHAR(50) user_reference
        VARCHAR(20) user_type
        DATETIME invalidated_at
        DATETIME expires_at
        VARCHAR(255) reason
    }
```

## Descrizione delle Entità

### **USER**
Utenti tecnici che gestiscono prodotti e inventario. Supporta soft-delete con pattern `is_active` + `end_date`.

### **USER_CREDENTIAL**
Credenziali di autenticazione per gli utenti tecnici. Una sola credenziale attiva per utente.

### **CUSTOMER**
Clienti finali che effettuano ordini. Supporta soft-delete.

### **CUSTOMER_CREDENTIAL**
Credenziali di autenticazione per i clienti. Una sola credenziale attiva per cliente.

### **CATEGORY**
Categorie prodotti per classificazione e filtri. Include slug univoco, nome, descrizione, icona e ordine di visualizzazione.

### **PRODUCT_MASTER**
Entità immutabile che rappresenta il codice prodotto (SKU). Ogni SKU può avere multiple versioni storiche.

### **PRODUCT_VERSION**
Versioni storiche di ogni prodotto. Solo una versione attiva per SKU è permessa alla volta.

### **CUSTOMER_ORDER**
Testata di ogni ordine (stateful). Memorizza informazioni di fatturazione/spedizione e timestamp del ciclo di vita.

### **ORDER_ITEM**
Collega ordini con prodotti acquistati, quantità e prezzi (snapshot al momento dell'acquisto).

### **SHIPMENT**
Informazioni di tracciamento spedizione per gli ordini. Traccia stato spedizione, corriere e timeline di consegna.

### **INVENTORY_QUANTITY**
Quantità di magazzino per SKU (scenario magazzino singolo). Tracciato sia per aggiornamenti tecnici che per aggiustamenti automatici dagli ordini.

### **CUSTOMER_WISHLIST**
Prodotti salvati dai clienti per acquisti futuri o monitoraggio prezzi. Vincolo di unicità su coppia cliente-prodotto.

### **JWT_BLACKLIST**
Memorizza token JWT invalidati per prevenire il riutilizzo dopo logout. Generico per qualsiasi tipo di utente.

## Relazioni Principali

1. **USER → PRODUCT_MASTER/VERSION/CATEGORY**: Gli utenti tecnici creano e gestiscono prodotti e categorie
2. **CUSTOMER → CUSTOMER_ORDER**: I clienti effettuano ordini
3. **CUSTOMER → CUSTOMER_WISHLIST**: I clienti salvano prodotti in wishlist
4. **CATEGORY → PRODUCT_VERSION**: Le categorie classificano i prodotti
5. **PRODUCT_MASTER → PRODUCT_VERSION**: Ogni prodotto ha versioni storiche
6. **CUSTOMER_ORDER → ORDER_ITEM**: Gli ordini contengono righe d'ordine
7. **ORDER_ITEM → PRODUCT**: Le righe d'ordine referenziano prodotti specifici
8. **CUSTOMER_ORDER → SHIPMENT**: Gli ordini hanno spedizioni associate
9. **PRODUCT_MASTER → INVENTORY_QUANTITY**: Ogni prodotto ha giacenze di magazzino
10. **PRODUCT_MASTER → CUSTOMER_WISHLIST**: I prodotti possono essere in wishlist

## Vincoli e Indici Unici

- Un solo utente attivo per `id`
- Una sola credenziale attiva per utente/cliente
- Una sola versione attiva per `product_master_id`
- Email cliente univoca
- Nome categoria univoco
- Codice prodotto univoco
- Codice di tracciamento spedizione univoco
- Una sola entry wishlist per coppia cliente-prodotto
