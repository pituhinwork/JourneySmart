import InAppBilling from 'react-native-billing';

import { Platform, NativeModules } from 'react-native';
import { InAppBillingBridge, InAppUtils } from 'NativeModules';
import iapReceiptValidator from 'iap-receipt-validator';

const password = 'b2d399548c3d4c6989ae3c0f14404f6d'; // Shared Secret from iTunes connect
const production = true; // use sandbox or production url for validation
const productId = 'uk.co.redcirclesolutions.journeysmart2';
const productIdIos = ['org.reactjs.native.example.JourneySmart.subscription'];
const receiptDataTemp = null;
const validateReceipt = iapReceiptValidator(password, production);

async function validate(receiptData) {
    try {
        const validationData = await validateReceipt(receiptData);
        // check if Auto-Renewable Subscription is still valid
        const today = new Date();
        if (validationData['latest_receipt_info'][0].expires_date < today) {
          return true;
        }
        return false;
    } catch(err) {
        return false;
    }
}

if (Platform.OS === 'android') {
  new InAppBilling(
    'MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAnj5BGIQsIgYMnoTjyeAGPBjXKUBfSBgy/coOTx4GQ3sHrzAQ1PRhu/wxjdsyNbtR58nHcG1xj4wY1u4vuLXms2qXh9tHLmr1rqEDNjEzZeLa3r973/J/xTZHpHVM9kv0itdlp1VZAGY+QJxT41TLBVZUxiFOucs2K2oFi7tpYaMZ4IaQx6DQ/YOeA4UpnXF0Nk+whGDQM9XWuv5kYB5+PmgiKSPEMC6EBr1CDyK8UaJXwwAdZHZ1XLedZoDyR2ToF41FkTdh4tvk8J0sRadbJt4BqGvpSZ8KG7B2KlzP6K9PMr3YFmcco0fNVmq4F9j9MokP49+mo8Z827BzgzXupQIDAQAB',
  );
}
else {
  InAppUtils.loadProducts(productIdIos, (error, products) => {
    InAppUtils.receiptData((error, receiptData) => {
      if (error) {
      } else {
        receiptDataTemp = receiptData;
      }
    });
  });
}



export function purchase() {
  if (Platform.OS === 'android') {
    try {
      InAppBilling.open()
        .then(() => InAppBilling.purchase(productId))
        .then(details => {
          return InAppBilling.close();
        })
        .catch(err => {
        });
    } catch (err) {
      return false;
    }
  }
  else {
    InAppUtils.canMakePayments((enabled) => {
      if(enabled) {
        InAppUtils.loadProducts(productIdIos, (error, products) => {
          InAppUtils.purchaseProduct(
            productIdIos[0],
            (error, response) => {
              // NOTE for v3.0: User can cancel the payment which will be available as error object here.
              if (response && response.productIdentifier) {
                InAppUtils.loadProducts(
                  productIdIos,
                  (error, products) => {
                    InAppUtils.receiptData(
                      (error, receiptData) => {
                        if (error) {
                        } else {
                          receiptDataTemp = receiptData;
                        }
                      }
                    );
                  }
                );
                return true;
                //unlock store here.
              }
              return false;
            }
          );
        });
      } else {
        return false;
      }
    });
  }
}

export async function isPurchased() {
  if (Platform.OS === 'android') {
    try {
      await InAppBilling.open();
      if (!await InAppBilling.isPurchased(productId)) {
        await InAppBilling.close();
        return false;
      }
      await InAppBilling.close();
      return true;
    } catch (err) {
      return false;
    }
  }
  else {
    return new Promise((resolve, reject) => {
      InAppUtils.canMakePayments((enabled) => {
        if(enabled) {
          if (receiptDataTemp === null) {
            resolve({ result: false });
          }
          else {
            resolve({ result: validate(receiptDataTemp)});
          }        
        } else {
          resolve({ result: false });
        }
      });
    });
  }
 }
// export function login(username, password) {
//     return new Promise((resolve, reject) => {
//       signin(username, password)
//         .then(resp => {
//           resp.json().then(json => {
//             if (json.response === "success") {
//               dispatch(setUser({ user: json.userDetail }));
//               resolve();
//             } else if (json.response === "error") {
//               reject(json.errors[0]);
//               // throw json.errors[0];
//             } else {
//               // Promise.reject(json.errors[0]);
//               reject("Internal server error.");
//             }
//           });
//         })
//         .catch(ex => {
//           // reject(ex);
//         });
//     });
// }