import * as React from 'react';
import styles from './RippleApi.module.scss';
import { TextField, MaskedTextField } from 'office-ui-fabric-react/lib/TextField';
import {  PrimaryButton } from 'office-ui-fabric-react/lib/Button';
import { Dropdown, IDropdownOption, IDropdownStyles } from "office-ui-fabric-react/lib/Dropdown";
import * as strings from 'RippleApiWebPartStrings';

const INTERVAL = 1000;
const ledgerOffset = 5;
const myInstructions = {maxLedgerVersionOffset: ledgerOffset};
export default class TransferXRP extends React.Component<any, any> {
  constructor(props){
   super(props); 
   this.state={ToAddress:"",Currency:"",Amount:"",
   myAccount:{}};
  }
  async sendXRP(){
   
     this.transact(this.props.api);
  
  }
  public async transact(api){
    const payment = {
      source: {
        address:this.props.FromAddress,
        maxAmount: {
          value: this.state.Amount,
          currency: this.state.Currency
        }
      },
      destination: {
        address:this.state.ToAddress,
        amount: {
          value: this.state.Amount,
          currency: this.state.Currency
        }
      }
    };
    if(this.state.Currency != 'XRP'){
      payment.source.maxAmount["counterparty"]=this.state.ToAddress;
      payment.destination.amount["counterparty"]=this.state.ToAddress;
    }
    console.log(payment);
    api.connect().then(() => {
     return api.preparePayment(this.props.FromAddress, payment, myInstructions);
     //return api.prepareTrustline(FromAddress,trustline);
    }).then(prepared => {
      console.log(prepared);
      return api.getLedger().then(ledger => {
        console.log('Current Ledger', ledger.ledgerVersion);
        return this.submitTransaction(ledger.ledgerVersion, prepared, this.props.Secret);
      });
    }).then(() => {
      api.disconnect().then(() => {
        console.log('api disconnected');     
      });
    }).catch(console.error);
  }
  verifyTransaction(hash, options) {
    console.log('Verifying Transaction');
    this.props.showToast('Verifying Transaction','warn');
    return this.props.api.getTransaction(hash, options).then(data => {
      this.props.showToast('Validated in Ledger: '+data.outcome.ledgerVersion,'info');
      this.props.showToast('Sequence: '+data.sequence,'info');
      this.props.showToast('Final Result: '+ data.outcome.result,'success');
      console.log('Final Result: ', data.outcome.result);
      console.log('Validated in Ledger: ', data.outcome.ledgerVersion);
      console.log('Sequence: ', data.sequence);
      return data.outcome.result === 'tesSUCCESS';
    }).catch(error => {
      /* If transaction not in latest validated ledger,
         try again until max ledger hit */
      if (error instanceof this.props.api.errors.PendingLedgerVersionError) {
        return new Promise((resolve, reject) => {
          setTimeout(() => this.verifyTransaction(hash, options)
          .then(resolve, reject), INTERVAL);
        });
      }
      return error;
    });
  }
  
  
  /* Function to prepare, sign, and submit a transaction to the XRP Ledger. */
   private submitTransaction(lastClosedLedgerVersion, prepared, secret) {
    const signedData =this.props.api.sign(prepared.txJSON, secret);
    return this.props.api.submit(signedData.signedTransaction).then(data => {

      this.props.showToast('Tentative Result: '+ data.resultCode + ' .Tentative Message: ' +data.resultMessage,'warn');
      console.log('Tentative Result: ', data.resultCode);
      console.log('Tentative Message: ', data.resultMessage);
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
  private _textToAddressChanged(newValue: string): void { 
    this.setState({ToAddress: newValue}); 
  } 
  private _textAmountChanged(newValue: string): void { 
    this.setState({Amount: newValue}); 
  }
 
  private _textCurrencyChanged(newValue): void { 
    console.log(newValue);
    let self=this;
    this.setState({Currency: newValue.key},()=>{
      this.findpath();
    }); 
    
  }
  private _transferAmtClicked(): void {
    console.log(this.state);
    this.sendXRP();
  }
  public findpath(){
    console.log(this.state.Currency);
    if(this.state.Currency.length == 3 && this.state.ToAddress != "" && this.state.Amount != ""){
    const pathfind = {
      "source": {"address": this.props.FromAddress},
      "destination": {"address": this.state.ToAddress,
        "amount": {"currency": this.state.Currency,"value": this.state.Amount}
      }
    };
    return this.props.api.getPaths(pathfind)
      .then(paths => {
        console.log(paths);
       this.props.showToast(paths.length + " tranction path found for selected currency","success");
      }).catch((e)=>{
        console.log(e);
        if(this.state.Currency != 'XRP')
        this.props.showToast(JSON.stringify(e),"error");
      
      });

    }
  }
  public render(): React.ReactElement<any> {
    return (
        <> 
       
        <div className={styles.sectionheading}> Transfer Fund</div>
        <div className={styles.row}> 
           
        <div className={styles.twocolumnlayout}>
                <TextField label="To Address" 
                 className={styles.labelheading}
                value={this.state.ToAddress} onChanged={this._textToAddressChanged.bind(this)}/>
            </div>
            <div className={styles.twocolumnlayout}>
                <TextField type="number" min="0" label="Amount to transfer" 
                onChanged={this._textAmountChanged.bind(this)}
                className={styles.labelheading}
                />
            </div>
            <div className={styles.twocolumnlayout}>
            <Dropdown
            label="Currency"
                selectedKey={this.state.Currency}
              onChanged={this._textCurrencyChanged.bind(this)} 
                options={this.props.CurrenciesDropdown}
                className={styles.labelheading}
                                />
            </div>
            
           
        </div>
        <div className={styles.row}>           
            <div className={styles.twocolumnlayout}>
            < PrimaryButton text="Transfer" onClick={this._transferAmtClicked.bind(this)}  />
            </div>
        </div>
      </>
      
    );
  }
}
