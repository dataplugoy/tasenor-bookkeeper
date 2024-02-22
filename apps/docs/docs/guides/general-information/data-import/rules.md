---
sidebar_position: 200
---

# Import Rules

How import rules are defined.

## Transaction rule system

The classification of the import data uses rule system describing how to transform segmented
data to *transfers*, i.e. generic description of bookkeeping events. Initially in the beginning
of the processing the settings and rules defined for the particular importer are copied to the
initial state of the process. During the processing we may ask questions and add more information
to the process.

So the structure of the configration is
```json
{
  "language": "fi",
  "currency": "EUR",
   ...
  "account.income.currency.EUR": "1910",
   ...
  "rules": [...],
  "questions": {...},
  "answers": {...}
}
```
There are
1. Generic universal settings like *language* or *currency*.
2. Then there is an account and import setting configuration that has been possibly resolved during the import process
   by asking from user, but which will also apply universally afterwards and are copied to the future import
   configuration.
3. **Rules** section defines how to map segments to transfers.
4. **Question** section defines UI questions to resolve some cases, that always require user interaction and
   cannot be resolved automatically.
5. **Answers** section is a collection of responses to questions stored by each segment. They are not universally
   copied to the importer, but are only relevant the current import only.

### Settings

The following general settings are used
- `currency` - A main currency of the bookkeeping database.
- `language` - A translation language for the imported texts.
- `tags.*.*.*` - A list of tags to be added for every transaction descriptions. Also some specific tags
                 can be specified, since `*.*.*` uses the same convention than account configurations.

Accounts are defined as the following.
- `account.<reason>.<type>.<asset>` - Defines the account number to be used for the given purpose.
                                      Parts can be `'*'` to allow any purpose. Otherwise they are
                                      explained in more detail in (TODO: Link to doc TransferAnalyzer).

Miscellaneous optional settings:
- `isTradeFeePartOfTotal` If set to `true`, assume that trading fee is included in the total.
                          Otherwise it is assumed to be paid on the top of the total.
- `recordDeposits` If set to false, skip deposits.
- `recordWithdrawals` If set to false, skip withdrawls.
- `allowShortSelling` If set, allow short selling, i.e. selling assets we don't have.

#### Example
```json
{
  "currency": "EUR",
  "language": "en",
  "tags.*.*.*": ["Lynx"],
  "account.deposit.currency.EUR": "1918",
  "account.deposit.external.EUR": "9999",
  "account.withdrawal.currency.EUR": "1918",
  "account.withdrawal.external.EUR": "9999",
  "account.expense.statement.INTEREST_EXPENSE": "9550",
  "account.expense.currency.EUR": "1918",

  "rules": [],
  "questions": [],
  "answers": {}
}
```

### Rules

Rules sections is a list of rule definitions of form
```json
{
   "name": "Name of the rule",
   "filter": "<expression>",
   "comment": "<optional description>",
   "options": {
     <optional flags>
   },
   "result": [
      <transfer1>, <transfer2>...
   ]
}
```
The *name* is any string describing the rule. Rules are used so that each segment resulting from the segmentation
step are handled in the order of their timestamps. Lines belonging to the segment are offered one by one to the
*filter* expression and if returning true, the entries in *result* are concatenated together. Each entry in the
result is a *transfer description*.

The filtering and result expressions has various variables set during the processing. All variables from
the segmentation is included. Typically they are the same as the column names in the CSV file for example.
See (TODO: Link to doc TransactionRules.classifyLines) for other variables available.

The structure of transfers are explained in (TODO: Link to doc TransferAnalyzer).

The syntax of the filter and result is explained in (TODO: link to doc TransactionUI.parseQuery).

Currently one one boolean option is supported: `singleMatch` which means that matching any of the lines in the
segment suffices and the parsing result is returned immediately when matching rule is found. The rest of the
lines are ignored. It is useful when for example using `sum(lines, 'field')` to gather values from all lines
of the segment at once.

### Questions

There are situation, where importer cannot deduct some part of the transfer automatically. In that case we can
define a question that needs to be answered every time, when the matching rule has been found. For example
we may determine based on the transaction data that it is related to computers but we want to know the exact
type of the purchase. Then we can define a question
```json
  {
    "name": "Computer purchase",
    "label": "What category is the purchase",
    "ask": {
      "Hardware equipment": "HARDWARE",
      "Software": "SOFTWARE"
    }
  },
```

The question can be used in the transfer as explained in (TODO: link to doc TransferAnalyzer).

Different question types are documented in (TODO: link to doc TransactionUI.parseQuery).

### Answers

This section collects answers given earlier during the processing. They are grouped per segment ID per transfer.
For example
```json
"d3e89d9af37dda4609bed94770fc5c52be946175": {
  "type": "HARDWARE"
},
```
It may contain also complete transaction definition, which will override all parsing
```json
  "581e46d024678ddcddc01ae36369bf6fc54f16b2": {
    "transfers": [
      {
        "data": {
          "text": "Payment for something"
        },
        "type": "account",
        "asset": "8650",
        "amount": 59.27,
        "reason": "expense"
      },
      {
        "type": "account",
        "asset": "3020",
        "amount": -59.27,
        "reason": "expense"
      }
    ]
 }
```
There is also a global answer section applied to all imports. If an asset has changed its name, it can be
stored like this in the empty segment ID:
```json
  {
  "": {
    "asset-renaming": [
        {
          "date": "<YYYY-MM-DD>"
          "type": "stock",
          "old": "<OLD ASSET>"
          "new": "<NEW ASSET>"
        }
      ]
    }
  }
```
