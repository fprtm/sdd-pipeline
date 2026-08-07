# Diagrams — <system name>

> **Plain-language summary:** _what these pictures show, in a sentence or two._

All diagrams are Mermaid so they version-control and render inline. Add
`%% covers REQ-xxx` above each so traceability can link them.

## 1. Context diagram
```mermaid
flowchart LR
  user([User])
  system[[Our System]]
  ext[(3rd-party API)]
  user --> system
  system --> ext
  %% covers REQ-001
```

## 2. Data-flow diagram (DFD) with trust boundaries
```mermaid
flowchart LR
  user([User]):::ext
  subgraph TB_public["TB: public internet"]
    user
  end
  subgraph TB_app["TB: application"]
    api[/API/]
    svc[[Service]]
  end
  subgraph TB_data["TB: data zone"]
    db[(Database)]
  end
  user -->|"credentials (secret)"| api
  api --> svc
  svc -->|"read/write (PII)"| db
  classDef ext fill:#eee,stroke:#999;
  %% covers REQ-001, REQ-NF-002
```

## 3. Sequence diagram — <journey name>
```mermaid
sequenceDiagram
  actor U as User
  participant FE as Frontend
  participant BE as Backend
  participant DB as Database
  U->>FE: action
  FE->>BE: request
  BE->>DB: query
  DB-->>BE: rows
  BE-->>FE: response
  FE-->>U: result
  %% covers REQ-001 -> FSD-001
```

## 4. ERD (if persistent data)
```mermaid
erDiagram
  USER ||--o{ WISHLIST_ITEM : saves
  PRODUCT ||--o{ WISHLIST_ITEM : in
```

## 5. State diagram (if an entity has a lifecycle)
```mermaid
stateDiagram-v2
  [*] --> draft
  draft --> placed
  placed --> paid
  paid --> shipped
  shipped --> [*]
```
