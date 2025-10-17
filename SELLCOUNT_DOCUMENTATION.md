# SELLCOUNT - Documentation Technique Complète

## Vue d'ensemble

SELLCOUNT est une plateforme SaaS de gestion et d'analyse TVA pour vendeurs e-commerce (Amazon), permettant l'analyse automatisée des rapports de transactions TVA, la conformité fiscale multi-juridictions, et la génération de déclarations.

## Architecture Technique

### Stack Technologique
- **Frontend**: React 18 + TypeScript + Vite
- **UI**: Tailwind CSS + shadcn/ui components
- **Backend**: Supabase (PostgreSQL + Edge Functions)
- **Authentification**: Supabase Auth
- **Stockage**: Supabase Storage
- **Déploiement**: Lovable Cloud

---

## ⚙️ MOTEUR DE RÈGLES YAML - Cœur Réacteur

### Architecture du Moteur

Le moteur de règles YAML (`src/utils/newYAMLVATEngine.ts`) est le cœur de SELLCOUNT. Il transforme les rapports CSV Amazon en analyses TVA détaillées via un système de règles déclaratives.

### Configuration YAML Complète

```yaml
preprocessing:
  drop_columns:
    - Colonnes inutiles à supprimer du CSV
  
  filters:
    - field: TRANSACTION_TYPE
      operator: not_in
      value: [Cancel, Refund, FreeReplacement]
  
  rename:
    OLD_NAME: NEW_NAME
  
  types:
    AMOUNT_FIELD: float
    DATE_FIELD: date
  
  derived_fields:
    - name: SIGNED_AMOUNT
      expression: "multiply(TOTAL_ACTIVITY_VALUE_AMT_VAT_EXCL, TRANSACTION_TYPE_SIGN)"

rules:
  - id: "oss_sales"
    name: "Ventes OSS (Union Européenne)"
    filters:
      - field: SCHEME
        operator: eq
        value: "OSS"
    aggregations:
      - type: sum
        field: SIGNED_AMOUNT
        output: total_ht
      - type: sum
        field: VAT_AMOUNT
        output: total_vat
      - type: count
        output: transaction_count
    group_by:
      - ARRIVAL_COUNTRY
      - VAT_RATE_PERCENT

  - id: "b2c_france"
    name: "Ventes B2C France"
    filters:
      - field: DEPARTURE_COUNTRY
        operator: eq
        value: "FR"
      - field: ARRIVAL_COUNTRY
        operator: eq
        value: "FR"
      - field: SCHEME
        operator: ne
        value: "OSS"

  - id: "b2b_intra"
    name: "Livraisons Intracommunautaires B2B"
    filters:
      - field: TRANSACTION_TYPE
        operator: in
        value: ["Shipment"]
      - field: DEPARTURE_COUNTRY
        operator: eq
        value: "FR"
      - field: ARRIVAL_COUNTRY
        operator: in_eu
      - field: VAT_ON_ITEM
        operator: eq
        value: 0

  - id: "swiss_voec"
    name: "Ventes Suisse (VOEC)"
    filters:
      - field: ARRIVAL_COUNTRY
        operator: eq
        value: "CH"

kpi_cards:
  - id: "total_sales"
    label: "CA Total HT"
    rules: ["oss_sales", "b2c_france", "b2b_intra"]
    metric: total_ht
    icon: "euro"
    color: "blue"
  
  - id: "oss_vat"
    label: "TVA OSS Collectée"
    rules: ["oss_sales"]
    metric: total_vat
    icon: "landmark"
    color: "green"
```

### Flux de Traitement

1. **Parsing CSV** → Détection intelligente du délimiteur (`,` `;` `\t`)
2. **Preprocessing** → Nettoyage, filtrage, normalisation des données
3. **Application des Règles** → Filtrage conditionnel + Agrégation par groupe
4. **Génération des Outputs**:
   - Breakdown TVA par pays/régime
   - KPI Cards pour dashboard
   - Déclarations TVA (OSS + nationale)
   - Transactions détaillées par produit

### Opérateurs Supportés

- **Comparaison**: `eq`, `ne`, `gt`, `lt`, `gte`, `lte`
- **Ensembles**: `in`, `not_in`, `in_eu` (codes pays UE)
- **Agrégations**: `sum`, `count`, `avg`, `min`, `max`

### Régimes TVA Détectés

- **OSS**: Ventes B2C Union Européenne (One Stop Shop)
- **B2C National**: Ventes domestiques avec TVA
- **B2B Intracommunautaire**: Livraisons UE sans TVA (autoliquidation)
- **Suisse VOEC**: Ventes Suisse avec IOSS/VOEC
- **Export Hors-UE**: Ventes hors UE (0% TVA)

---

## 📊 Modules Fonctionnels

### 1. **Analyse VAT (AnalysisPage)**
- Upload fichier CSV Amazon VAT Transaction Report
- Traitement via moteur YAML
- Affichage breakdown TVA par pays/régime
- Graphiques analytics (Recharts)
- Export Excel détaillé

### 2. **Rapports (ReportsPage)**
- Liste des rapports VAT sauvegardés
- Filtrage par période
- Statistiques agrégées (CA, TVA collectée, nombre de transactions)
- Export Excel par rapport
- Suppression de rapports

### 3. **Analyse Produits (ProductAnalysisPage)**
- **NOUVEAU MODULE** - Analyse granulaire par ASIN/SKU
- Agrégation des montants HT, TVA, transactions par produit
- Classification par régime (OSS, Domestique, Intracommunautaire, Suisse)
- Identification compte comptable par régime
- Recherche/filtrage par ASIN, nom produit, pays
- Export Excel avec 2 feuilles:
  - Détail par produit (ASIN, nom, pays, régime, montants, taux TVA)
  - Synthèse par régime

### 4. **Conformité (CompliancePage)**
- Vue par juridiction des obligations TVA
- Statut de conformité (compliant/warning)
- Dates de prochaine échéance
- Montants à déclarer par pays
- Distinction OSS vs nationale

### 5. **Activité (ActivityPage)**
- Ingestion de données transactionnelles
- KPI Cards (CA, commandes, panier moyen, ROI publicitaire)
- Graphiques temporels et par canal
- Filtres par période et canal
- Export Excel

### 6. **Juridictions (JurisdictionsPage)**
- Configuration des pays d'enregistrement TVA
- Numéros de TVA intracommunautaires
- Taux de TVA par pays
- Activation OSS

### 7. **Dashboard Comptables (Firm)**
- Gestion multi-clients
- Invitations clients
- Rapports consolidés
- Vue d'ensemble activité clients

---

## 🗄️ Schéma de Base de Données

### Tables Principales

```sql
-- Rapports VAT
vat_reports
  - id (uuid)
  - user_id (uuid)
  - file_id (uuid, nullable)
  - name (text)
  - data (jsonb) → Contient breakdown, kpis, declarations, transactions
  - total_amount (numeric)
  - currency (text)
  - created_at (timestamp)

-- Fichiers uploadés
user_files
  - id (uuid)
  - user_id (uuid)
  - file_name (text)
  - file_path (text)
  - file_size (integer)
  - status (text)
  - created_at (timestamp)

-- Juridictions configurées
jurisdictions
  - id (uuid)
  - user_id (uuid)
  - country_code (text)
  - vat_number (text)
  - vat_rate (numeric)
  - is_oss_enabled (boolean)

-- Données d'activité
activity_data
  - id (uuid)
  - user_id (uuid)
  - date (date)
  - channel (text)
  - revenue (numeric)
  - orders (integer)
  - ad_spend (numeric)

-- Organisations (mode cabinet)
organizations
  - id (uuid)
  - name (text)
  - type (text) → "INDIVIDUAL" | "FIRM"

-- Clients (pour cabinets)
clients
  - id (uuid)
  - firm_id (uuid)
  - name (text)
  - email (text)
```

---

## 🔐 Sécurité et RLS

- **Row Level Security** activé sur toutes les tables
- Policies d'accès basées sur `auth.uid()`
- Isolation des données par utilisateur/organisation
- Edge Functions sécurisées avec JWT

---

## 📈 Intégrations

### Supabase Edge Functions
- `send-auth-email`: Emails de confirmation signup
- `ingest-activity`: Import CSV données activité
- `import-activity-csv`: Traitement batch activité

### Exports Excel (XLSX)
- Breakdown détaillé TVA
- Rapports conformité
- Analyse produits
- Données activité

---

## 🎯 Cas d'Usage Principaux

### Pour Vendeurs E-commerce
1. Upload rapport Amazon VAT mensuel
2. Analyse automatique via moteur YAML
3. Visualisation breakdown TVA par pays
4. Identification montants à déclarer (OSS vs national)
5. Export Excel pour comptable
6. Suivi conformité multi-juridictions

### Pour Cabinets Comptables
1. Création organisation "FIRM"
2. Invitation clients
3. Upload rapports pour chaque client
4. Consolidation analyses
5. Exports multi-clients
6. Suivi échéances globales

### Pour Analyse Produits
1. Sélection rapport VAT
2. Extraction transactions par ASIN
3. Agrégation montants par produit/régime
4. Classification compte comptable
5. Export détaillé pour facturation

---

## 🚀 Points Clés Différenciants

1. **Moteur YAML Déclaratif**: Configuration lisible, maintenable, évolutive
2. **Multi-régimes**: OSS, B2B intra-EU, Suisse, national
3. **Granularité Produit**: Analyse ASIN-level pour facturation précise
4. **Compliance Automatisée**: Détection obligations + échéances
5. **Multi-tenant**: Support individuel + cabinet comptable
6. **Export Excel Avancé**: Feuilles multiples, formatage, agrégations

---

## 📝 Commandes de Développement

```bash
# Installation
npm install

# Développement local
npm run dev

# Build production
npm run build

# Déploiement Lovable
lovable deploy
```

---

## 🔄 Évolutions Futures Possibles

- [ ] Import automatique via API Amazon
- [ ] Génération déclarations TVA (formulaires CA3, DEB)
- [ ] Alertes échéances par email
- [ ] Dashboard analytics avancé (prédictions)
- [ ] Support Shopify, eBay, autres marketplaces
- [ ] OCR pour factures fournisseurs
- [ ] Intégration comptabilité (QuickBooks, Sage)

---

## 📞 Support

- Documentation: `/docs`
- Help Page: `/dashboard/help`
- Email: support@sellcount.com

---

**Version**: 1.0.0  
**Dernière mise à jour**: 2025-10-17  
**Moteur YAML**: v2.0 (production-ready)
