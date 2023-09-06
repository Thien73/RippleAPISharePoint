import * as React from 'react';
import styles from './RippleApi.module.scss';
import { IRippleApiProps } from './IRippleApiProps';
import { escape } from '@microsoft/sp-lodash-subset';
import { TextField, MaskedTextField } from 'office-ui-fabric-react/lib/TextField';
import { Stack, IStackProps, IStackStyles } from 'office-ui-fabric-react/lib/Stack';
import {  PrimaryButton } from 'office-ui-fabric-react/lib/Button';
import * as strings from 'RippleApiWebPartStrings';
const { RippleAPI } = require('ripple-lib');
const FromAddress=strings.FromAddress;
const FromSecret=strings.FromSecret;
const api = new RippleAPI({server: strings.ServerName});
const ToAddress='';
const myOrder = {
  "source": {
    "address": FromAddress,
    "maxAmount": {
      "value": "78",
      "currency": "X4U",
      "counterparty": "rGa7tyRD2se4yxJfru9EFY4QG9oKFjJ6o1"
    }
  },
  "destination": {
    "address": 'rGa7tyRD2se4yxJfru9EFY4QG9oKFjJ6o1',
    "amount": {
      "value": "78",
      "currency": "X4U",
      "counterparty": "rGa7tyRD2se4yxJfru9EFY4QG9oKFjJ6o1"
    }
  }
};
const trustline = {
  "currency": "BAS",
  "counterparty": "rGa7tyRD2se4yxJfru9EFY4QG9oKFjJ6o1",
  "limit": "1000",
  "qualityIn": 0.91,
  "qualityOut": 0.87,
  "ripplingDisabled": true,
  "frozen": false,
  "memos": [
    {
      "type": "test",
      "format": "plain/text",
      "data": "texted data"
    }
  ]
};

const INTERVAL = 1000;
/* Instantiate RippleAPI. Uses s2 (full history server) */
/* Number of ledgers to check for valid transaction before failing */
const ledgerOffset = 5;
const myInstructions = {maxLedgerVersionOffset: ledgerOffset};


export default class Trustlines extends React.Component<any, any> {
  constructor(props){
   super(props); 
   this.state={ToAddress:"ra6Yp1K3FMfkFT7mySZKrwppcprzXrkprH",FromAddress:strings.FromAddress,Amount:"",myAccount:{}};
 //  this.getTrustlines();
 
     api.connect().then(() => {
      console.log('Connected');
    //  return api.preparePayment(FromAddress, myOrder, myInstructions);
    return api.prepareTrustline(FromAddress,trustline);
    }).then(prepared => {
      console.log(prepared);
      return api.getLedger().then(ledger => {
        console.log('Current Ledger', ledger.ledgerVersion);
        return this.submitTransaction(ledger.ledgerVersion, prepared, FromSecret);
      });
    }).then(() => {
      api.disconnect().then(() => {
        console.log('api disconnected');
        
      });
    }).catch(console.error);

  }
   verifyTransaction(hash, options) {
    console.log('Verifying Transaction');
    return api.getTransaction(hash, options).then(data => {
      console.log('Final Result: ', data.outcome.result);
      console.log('Validated in Ledger: ', data.outcome.ledgerVersion);
      console.log('Sequence: ', data.sequence);
      return data.outcome.result === 'tesSUCCESS';
    }).catch(error => {
      /* If transaction not in latest validated ledger,
         try again until max ledger hit */
      if (error instanceof api.errors.PendingLedgerVersionError) {
        return new Promise((resolve, reject) => {
          setTimeout(() => this.verifyTransaction(hash, options)
          .then(resolve, reject), INTERVAL);
        });
      }
      return error;
    });
  }
  
  
  /* Function to prepare, sign, and submit a transaction to the XRP Ledger. */
   submitTransaction(lastClosedLedgerVersion, prepared, secret) {
    const signedData = api.sign(prepared.txJSON, secret);
    return api.submit(signedData.signedTransaction).then(data => {
      console.log('Tentative Result: ', data.resultCode);
      console.log('Tentative Message: ', data.resultMessage);
      /* The tentative result should be ignored. Transactions that succeed here can ultimately fail,
         and transactions that fail here can ultimately succeed. */
  
      /* Begin validation workflow */
      const options = {
        minLedgerVersion: lastClosedLedgerVersion,
        maxLedgerVersion: prepared.instructions.maxLedgerVersion
      };
      return new Promise((resolve, reject) => {
        setTimeout(() => this.verifyTransaction(signedData.id, options)
      .then(resolve, reject), INTERVAL);
      });
    });
  }
  
 public async setTrustlines(api){
  
  const trustline = {
    "currency": "BAS",
    "counterparty": "rGa7tyRD2se4yxJfru9EFY4QG9oKFjJ6o1",
    "limit": "1000",
    "qualityIn": 0.91,
    "qualityOut": 0.87,
    "ripplingDisabled": true,
    "frozen": false,
    "memos": [
      {
        "type": "test",
        "format": "plain/text",
        "data": "texted data"
      }
    ]
  };
  const prepared = await api.prepareTrustline(FromAddress,trustline);
  // Sign the payment using the sender's secret
  const { signedTransaction } = api.sign(prepared.txJSON, FromSecret);
  console.log('Signed', signedTransaction) 
  // Submit the payment
  const res = await api.submit(signedTransaction);
  console.log(res);
  console.log('Done', res);
  if(res.resultCode.indexOf("SUCCESS")>0){
    alert(res.resultCode);
    //window.location.href=location.href;

  }
 }
 public getTrustlines(){
  this.props.api.getTrustlines(FromAddress).then(trustlines =>
    {
      console.log("trustlines");
      console.log(trustlines);
    });
 }
  
  
  public render(): React.ReactElement<any> {
    return (
    
        <> 
        <div className={styles.row}> 
           
        </div>
      </>
      
    );
  }
}
