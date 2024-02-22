/**
 * This file was auto-generated by openapi-typescript.
 * Do not make direct changes to the file.
 */

export interface paths {
  "/auth": {
    post: operations["login"];
  };
  "/db": {
    get: operations["getDatabases"];
    post: operations["createDatabase"];
  };
  "/db/{databaseName}": {
    delete: operations["deleteDatabase"];
  };
  "/db/upload": {
    post: operations["uploadDatabase"];
  };
  "/db/account/{databaseName}": {
    get: operations["getAccounts"];
  };
  "/db/account/{databaseName}/{id}": {
    get: operations["getAccount"];
    patch: operations["updateAccount"];
  };
}

export interface components {}

export interface operations {
  login: {
    responses: {
      /** Login successful. */
      200: {
        content: {
          "application/json": {
            /**
             * @description Access token for API end points.
             * @example 7bf61f0db64ec74f68ff099e53b218e9611a0
             */
            token: string;
            /**
             * @description Access token for renewing existing token.
             * @example XRhIjp7ImF1ZGllbmNlIjoiYm9va2tl
             */
            refresh: string;
            /**
             * @description Encryption key for client semi-private data stored in the local store.
             * @example 5a4f52c1caa84912b58830a0d1c1a5e8
             */
            key: string;
            /**
             * @description Encryption data for client semi-private data stored in the local store.
             * @example lZXBpbmciLCJpc3MiOiJBYmFj
             */
            data: string;
          };
        };
      };
      /** Login failed. */
      401: {
        content: {
          "application/json": {
            /** @example Incorrect username or password. */
            message: string;
          };
        };
      };
    };
    requestBody: {
      content: {
        "application/json": {
          /**
           * @description Email of the user.
           * @example my.name@gmail.com
           */
          user: string;
          /**
           * @description Password of the user.
           * @example hiwD322ds_aede2
           */
          password: string;
        };
      };
    };
  };
  getDatabases: {
    responses: {
      /** Get the list of all databases accessible by the authenticated user. */
      200: {
        content: {
          "application/json": {
            /**
             * @description Globally unique name for the database.
             * @example mydb2
             */
            name?: string;
          }[];
        };
      };
      /** User is not authenticated. */
      403: {
        content: {
          "application/json": {
            /**
             * @description Error message.
             * @example Access denied.
             */
            message: string;
          };
        };
      };
    };
  };
  createDatabase: {
    responses: {
      /** New database successfully created. */
      204: never;
      /** Invalid payload in the request. */
      400: {
        content: {
          "application/json": {
            /**
             * @description Explanation of the incorrect request parameters.
             * @example Invalid parameters for request.
             */
            message: string;
          };
        };
      };
      403: paths["/db"]["get"]["responses"]["403"];
    };
    requestBody: {
      content: {
        "application/json": paths["/db"]["get"]["responses"]["200"]["content"]["application/json"]["schema"]["items"] & {
          /**
           * @description A code of the supported scheme available.
           * @example SchemaName
           */
          scheme: string;
          /**
           * @description Name of the company,
           * @example Company Inc.
           */
          companyName: string;
          /**
           * @description Official registration code of the company.
           * @example 1234567-US
           */
          companyCode?: string;
          /**
           * @description Language used in the database.
           * @example en
           * @enum {string}
           */
          language?: "fi" | "en";
          /**
           * @description System default currency for the database.
           * @example USD
           * @enum {string}
           */
          currency?: "EUR" | "ZAR" | "USD";
        } & {
          databaseName: unknown;
        };
      };
    };
  };
  deleteDatabase: {
    parameters: {
      path: {
        /** Name of the database to delete. */
        databaseName: string;
      };
    };
    responses: {
      /** Database successfully deleted. */
      204: never;
      400: paths["/db"]["post"]["responses"]["400"];
      403: paths["/db"]["get"]["responses"]["403"];
      /** Required target not found. */
      404: {
        content: {
          "application/json": {
            /**
             * @description Error message.
             * @example Not found.
             */
            message: string;
          };
        };
      };
    };
  };
  uploadDatabase: {
    responses: {
      /** New database successfully created. */
      204: never;
      400: paths["/db"]["post"]["responses"]["400"];
      403: paths["/db"]["get"]["responses"]["403"];
      /** Proccessing ended in internal error. */
      500: {
        content: {
          "application/json": {
            /**
             * @description Error message.
             * @example Internal server error.
             */
            message: string;
          };
        };
      };
    };
    requestBody: {
      content: {
        "multipart/form-data": {
          /**
           * Format: binary
           * @description A database file in the format used for saving database to the file.
           */
          file?: string;
        };
      };
    };
  };
  getAccounts: {
    parameters: {
      path: {
        /** Name of the database. */
        databaseName: string;
      };
    };
    responses: {
      /** Get the list of all accounts in the database. */
      200: {
        content: {
          "application/json": {
            /** @description The ID of the account. */
            id?: number;
            /**
             * @description Numeric code of the account as a string.
             * @example 3000
             */
            number?: string;
            /**
             * @description Name of the account.
             * @example Savings Bank Account
             */
            name?: string;
            /**
             * @description Language used in the database.
             * @example ASSET
             * @enum {string}
             */
            type?:
              | "ASSET"
              | "LIABILITY"
              | "EQUITY"
              | "REVENUE"
              | "EXPENSE"
              | "PROFIT_PREV"
              | "PROFIT";
            /**
             * @description Language of the account name translation.
             * @example en
             * @enum {string}
             */
            language?: "fi" | "en";
            /**
             * @description Currency used in the account.
             * @example USD
             * @enum {string}
             */
            currency?: "EUR" | "ZAR" | "USD";
            /**
             * @description If set, this account can be filtered as favourite account.
             * @example true
             */
            favourite?: boolean;
            /** @description The tax type code. */
            tax?: string;
          }[];
        };
      };
      403: paths["/db"]["get"]["responses"]["403"];
    };
  };
  getAccount: {
    parameters: {
      path: {
        /** Name of the database to delete. */
        databaseName: string;
        /** The ID of the account. */
        id: number;
      };
    };
    responses: {
      /** Get the details of the account. */
      200: {
        content: {
          "application/json": paths["/db/account/%7BdatabaseName%7D"]["get"]["responses"]["200"]["content"]["application/json"]["schema"]["items"] & {
            /** @description List of periods that account has transactions. */
            periods?: ({
              /** @description The ID of the period. */
              id?: number;
              /**
               * Format: date
               * @description The first date included in the period.
               * @example 2001-01-01
               */
              start_date?: string;
              /**
               * Format: date
               * @description The last date included in the period.
               * @example 2001-12-31
               */
              end_date?: string;
              /** @description If set, the period transactions cannot be modified anymore. */
              locked?: boolean;
            } & {
              /**
               * @description The number of transactions for the account in this period.
               * @example 31
               */
              entries?: number;
            })[];
          };
        };
      };
      403: paths["/db"]["get"]["responses"]["403"];
      404: paths["/db/%7BdatabaseName%7D"]["delete"]["responses"]["404"];
    };
  };
  updateAccount: {
    parameters: {
      path: {
        /** Name of the database to delete. */
        databaseName: string;
        /** The ID of the account. */
        id: number;
      };
    };
    responses: {
      /** Account updated successfully. */
      204: never;
      403: paths["/db"]["get"]["responses"]["403"];
    };
    requestBody: {
      content: {
        "application/json": paths["/db/account/%7BdatabaseName%7D"]["get"]["responses"]["200"]["content"]["application/json"]["schema"]["items"];
      };
    };
  };
}

export interface external {}