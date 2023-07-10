import { AccountNumber, TagType } from "."
import { Currency, Language, Version } from "../common"

/**
 * Configuration definition for the bookkeeper.
 */
export type BookkeeperConfig = {
  scheme: string | null,
  schemeVersion: Version | null,
  companyCode: string | null,
  companyName: string | null,
  currency: Currency | null,
  language: Language | null,
  VAT?: {
    delayedPayableAccount: AccountNumber | null,
    delayedReceivableAccount: AccountNumber | null,
    payableAccount: AccountNumber | null,
    purchasesAccount: AccountNumber | null,
    receivableAccount: AccountNumber | null,
    salesAccount: AccountNumber | null,
    statementTagTypes: TagType[]
  },
  FinnishIncomeStatementReport?: {
    tagTypes: TagType[];
  }
}
