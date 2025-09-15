# BACKUP - Moteur de Règles TVA YAML
**Date de sauvegarde:** 15 septembre 2025  
**Version:** Fonctionnelle - Analyse des rapports Amazon VAT Transaction Report

## État du Système
✅ **FONCTIONNEL** - Le moteur analyse correctement les fichiers CSV Amazon avec:
- Détection automatique des transactions SALE/REFUND
- Parsing correct des montants HT signés
- Classification fiscale (OSS, B2C, B2B, Intracommunautaire, Suisse)
- Gestion des fichiers avec guillemets doublés (format Amazon)

## Configuration YAML Intégrée

```yaml
version: 1
name: TVA_Amazon (Signed Amounts + Résidu)

# ============================================
# PRE-PROCESSING — normalisation & montant signé
# ============================================
preprocessing:
  steps:
    # 1) Ne garder que les colonnes utiles
    - type: drop_columns_except
      columns:
        - TRANSACTION_TYPE
        - TOTAL_ACTIVITY_VALUE_AMT_VAT_EXCL
        - TAX_REPORTING_SCHEME
        - SALE_ARRIVAL_COUNTRY
        - SALE_DEPART_COUNTRY
        - BUYER_VAT_NUMBER_COUNTRY

    # 2) Ne garder que SALE / REFUND (⚠️ "SALE" pas "SALES")
    - type: filter
      column: TRANSACTION_TYPE
      operator: in
      value: ["SALE","REFUND"]

    # 3) Renommer pour faciliter la suite
    - type: rename_columns
      mapping:
        TOTAL_ACTIVITY_VALUE_AMT_VAT_EXCL: AMOUNT_RAW
        TAX_REPORTING_SCHEME: SCHEME
        SALE_ARRIVAL_COUNTRY: ARRIVAL
        SALE_DEPART_COUNTRY: DEPART
        BUYER_VAT_NUMBER_COUNTRY: BUYER_VAT
        TRANSACTION_TYPE: TX_TYPE

    # 4) Normaliser les vides (B2C)
    - type: normalize_empty
      columns: ["BUYER_VAT"]
      empty_values: ["", "(VIDE)", "(VIDES)", "NULL", "N/A", "-", "—", "NONE", " "]

    # 5) Uniformiser les codes pays
    - type: uppercase
      columns: ["ARRIVAL","DEPART","BUYER_VAT"]

    # 6) Assainir les montants
    - type: to_number
      column: AMOUNT_RAW
      options:
        replace_decimal_comma: true
        remove_thousand_seps: true
        strip_currency_symbols: true

    # 7) Créer AMOUNT_SIGNED (refunds en négatif)
    - type: compute
      as: AMOUNT_SIGNED
      formula:
        when:
          - if:   { column: TX_TYPE, operator: "=", value: "REFUND" }
            then: NEGATE("AMOUNT_RAW")
        else: VALUE("AMOUNT_RAW")

# ============================================
# RÈGLES — ventilation fiscale
# ============================================
rules:

  # 1) OSS (UNION-OSS)
  - id: oss_total
    label: "OSS - Total"
    filters:
      - { column: SCHEME, operator: "=", value: "UNION-OSS" }
    aggregations:
      - { column: AMOUNT_SIGNED, function: SUM }
      - { column: AMOUNT_SIGNED, function: COUNT }

  - id: oss_by_country
    label: "OSS - Par pays (arrivée)"
    filters:
      - { column: SCHEME, operator: "=", value: "UNION-OSS" }
    group_by: ["ARRIVAL"]
    aggregation: { column: AMOUNT_SIGNED, function: SUM }

  # 2) Domestique B2C (REGULAR + acheteur sans TVA)
  - id: b2c_total
    label: "Domestique B2C - Total"
    filters:
      - { column: SCHEME, operator: "=", value: "REGULAR" }
      - { column: BUYER_VAT, operator: "is_empty" }
    aggregations:
      - { column: AMOUNT_SIGNED, function: SUM }
      - { column: AMOUNT_SIGNED, function: COUNT }

  - id: b2c_by_country
    label: "Domestique B2C - Par pays (départ)"
    filters:
      - { column: SCHEME, operator: "=", value: "REGULAR" }
      - { column: BUYER_VAT, operator: "is_empty" }
    group_by: ["DEPART"]
    aggregation: { column: AMOUNT_SIGNED, function: SUM }

  # 3) Domestique B2B (vend. = achet. même pays)
  - id: b2b_dom_total
    label: "Domestique B2B - Total"
    filters:
      - { column: SCHEME, operator: "=", value: "REGULAR" }
      - { column: BUYER_VAT, operator: "=", value_from: "DEPART" }
    aggregations:
      - { column: AMOUNT_SIGNED, function: SUM }
      - { column: AMOUNT_SIGNED, function: COUNT }

  - id: b2b_dom_by_country
    label: "Domestique B2B - Par pays (départ)"
    filters:
      - { column: SCHEME, operator: "=", value: "REGULAR" }
      - { column: BUYER_VAT, operator: "=", value_from: "DEPART" }
    group_by: ["DEPART"]
    aggregation: { column: AMOUNT_SIGNED, function: SUM }

  # 4) Intracommunautaire (vend. ≠ achet. ≠ vide)
  - id: intra_total
    label: "Intracommunautaire - Total"
    filters:
      - { column: SCHEME, operator: "=", value: "REGULAR" }
      - { column: BUYER_VAT, operator: "!=", value_from: "DEPART" }
      - { column: BUYER_VAT, operator: "is_not_empty" }
    aggregations:
      - { column: AMOUNT_SIGNED, function: SUM }
      - { column: AMOUNT_SIGNED, function: COUNT }

  - id: intra_by_country
    label: "Intracommunautaire - Par pays (départ)"
    filters:
      - { column: SCHEME, operator: "=", value: "REGULAR" }
      - { column: BUYER_VAT, operator: "!=", value_from: "DEPART" }
      - { column: BUYER_VAT, operator: "is_not_empty" }
    group_by: ["DEPART"]
    aggregation: { column: AMOUNT_SIGNED, function: SUM }

  # 5) Suisse (VOEC)
  - id: suisse_total
    label: "Suisse (VOEC) - Total"
    filters:
      - { column: SCHEME, operator: "=", value: "CH_VOEC" }
    aggregations:
      - { column: AMOUNT_SIGNED, function: SUM }
      - { column: AMOUNT_SIGNED, function: COUNT }

  - id: suisse_by_country
    label: "Suisse (VOEC) - Par pays (arrivée)"
    filters:
      - { column: SCHEME, operator: "=", value: "CH_VOEC" }
    group_by: ["ARRIVAL"]
    aggregation: { column: AMOUNT_SIGNED, function: SUM }

  # 6) Grand total (toutes catégories)
  - id: grand_total_all
    label: "Total général (toutes transactions)"
    filters: []
    aggregation: { column: AMOUNT_SIGNED, function: SUM }

  # 7) REGULAR total & par pays (pour sanity check)
  - id: regular_total
    label: "REGULAR - Total"
    filters:
      - { column: SCHEME, operator: "=", value: "REGULAR" }
    aggregation: { column: AMOUNT_SIGNED, function: SUM }

  - id: regular_by_country
    label: "REGULAR - Par pays (départ)"
    filters:
      - { column: SCHEME, operator: "=", value: "REGULAR" }
    group_by: ["DEPART"]
    aggregation: { column: AMOUNT_SIGNED, function: SUM }

  # 8) Autre / Résidu (tout ce qui n'entre dans aucune cat.)
  #    Implémenté par exclusion des 5 catégories ci-dessus.
  - id: residu_total
    label: "Autre / Résidu - Total"
    filters:
      - exclude_rules: ["oss_total","b2c_total","b2b_dom_total","intra_total","suisse_total"]
    aggregation: { column: AMOUNT_SIGNED, function: SUM }

# ============================================
# KPI CARDS — en tête du dashboard
# ============================================
kpi_cards:
  - title: "Total général"
    rule: grand_total_all
    metrics:
      - { label: "Montant HT (signé)", field: "SUM(AMOUNT_SIGNED)" }
      - { label: "Transactions",        field: "COUNT(AMOUNT_SIGNED)" }

  - title: "OSS"
    rule: oss_total
    metrics:
      - { label: "Montant HT (signé)", field: "SUM(AMOUNT_SIGNED)" }
      - { label: "Transactions",        field: "COUNT(AMOUNT_SIGNED)" }

  - title: "Domestique B2C"
    rule: b2c_total
    metrics:
      - { label: "Montant HT (signé)", field: "SUM(AMOUNT_SIGNED)" }
      - { label: "Transactions",        field: "COUNT(AMOUNT_SIGNED)" }

  - title: "Domestique B2B"
    rule: b2b_dom_total
    metrics:
      - { label: "Montant HT (signé)", field: "SUM(AMOUNT_SIGNED)" }
      - { label: "Transactions",        field: "COUNT(AMOUNT_SIGNED)" }

  - title: "Intracommunautaire"
    rule: intra_total
    metrics:
      - { label: "Montant HT (signé)", field: "SUM(AMOUNT_SIGNED)" }
      - { label: "Transactions",        field: "COUNT(AMOUNT_SIGNED)" }

  - title: "Suisse (VOEC)"
    rule: suisse_total
    metrics:
      - { label: "Montant HT (signé)", field: "SUM(AMOUNT_SIGNED)" }
      - { label: "Transactions",        field: "COUNT(AMOUNT_SIGNED)" }

  - title: "Autre / Résidu"
    rule: residu_total
    metrics:
      - { label: "Montant HT (signé)", field: "SUM(AMOUNT_SIGNED)" }
      - { label: "Transactions",        field: "COUNT(AMOUNT_SIGNED)" }
```

## Points Critiques Résolus

### 1. Parsing CSV Amazon
- **Problème:** Fichiers avec guillemets doublés et enveloppe externe
- **Solution:** Normalisation préalable des lignes avec détection automatique

### 2. Détection Transaction Type
- **Colonnes supportées:** TRANSACTION_TYPE (priorité), TRANSACTION_EVENT_TYPE, EVENT_TYPE, TYPE
- **Valeurs acceptées:** "SALE", "REFUND" (case-insensitive)
- **Fallback:** Recherche heuristique dans toutes les colonnes

### 3. Extraction Montants
- **Priorité VAT_EXCL:** TOTAL_ACTIVITY_VALUE_AMT_VAT_EXCL, TRANSACTION_VALUE_AMT_VAT_EXCL
- **Fallback VAT_INCL:** Si pas de VAT_EXCL disponible
- **Parsing robuste:** Gestion virgules/points décimaux, devises, parenthèses négatives

### 4. Classification Fiscale
- **OSS:** TAX_REPORTING_SCHEME = "UNION-OSS"
- **B2C:** SCHEME = "REGULAR" + BUYER_VAT vide
- **B2B Domestique:** SCHEME = "REGULAR" + BUYER_VAT = DEPART
- **Intracommunautaire:** SCHEME = "REGULAR" + BUYER_VAT ≠ DEPART ≠ vide
- **Suisse:** SCHEME = "CH_VOEC"

## Instructions de Restauration

Si le moteur ne fonctionne plus à l'avenir:

1. **Remplacer le contenu de `src/utils/newYAMLVATEngine.ts`**
2. **Vérifier les colonnes Amazon:** Le format peut évoluer
3. **Tester avec un petit échantillon** avant traitement complet
4. **Consulter les logs console** pour diagnostic

## Format CSV Attendu (Amazon VAT Transaction Report)

```
Colonnes obligatoires:
- TRANSACTION_TYPE (SALE/REFUND)
- TOTAL_ACTIVITY_VALUE_AMT_VAT_EXCL (montant HT)
- TAX_REPORTING_SCHEME (REGULAR/UNION-OSS/CH_VOEC)
- SALE_ARRIVAL_COUNTRY (pays destination)
- SALE_DEPART_COUNTRY (pays origine) 
- BUYER_VAT_NUMBER_COUNTRY (pays TVA acheteur, vide = B2C)
```

## Dernière Modification
**15/09/2025** - Correction parsing CSV guillemets doublés Amazon

---
*Ce backup permet de restaurer le moteur de règles TVA en cas de régression future.*