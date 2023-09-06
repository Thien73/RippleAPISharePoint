import * as React from 'react';
import styles from './RippleApi.module.scss';
import { IRippleApiProps } from './IRippleApiProps';
import * as strings from 'RippleApiWebPartStrings';
import TransferXRP from './TransferXRP';
import Trustlines from './Trustlines';
const { RippleAPI } = require('ripple-lib');
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { Panel, PanelType } from 'office-ui-fabric-react/lib/Panel';
import { TextField, MaskedTextField } from 'office-ui-fabric-react/lib/TextField';
import {  PrimaryButton } from 'office-ui-fabric-react/lib/Button';
import { Dropdown, IDropdownOption, IDropdownStyles } from "office-ui-fabric-react/lib/Dropdown";
const ToAddress='';
const INTERVAL = 1000;
const ledgerOffset = 5;
const myInstructions = {maxLedgerVersionOffset: ledgerOffset};
const api = new RippleAPI({server: strings.ServerName});
export default class RippleApi extends React.Component<IRippleApiProps, any> {
  constructor(props){
   super(props); 
   
   this.state={ToAddress:"",FromAddress:strings.FromAddress, 
   Secret:"ssZqmYWRg75UoYAa6E3fSfKUCb6dA",
   showPanel:false,CurrenciesDropdown:[],
   AccountCurrencies:{},CurrenciesYouCanSend:[],CurrenciesYouCanReceive:[],
   Amount:"Processing..",myAccount:{},myTrustlines:{},msg:""};
    this.run();
  }
  async run() {
    var self=this;
    api.connect().then(() => {
      console.log('getting account info for', this.state.FromAddress);
      return api.getAccountInfo(this.state.FromAddress);
    }).then(info => {

      self.setState({myAccount:info});     
      this.account_currencies();  
      toast.success("You XRP Balance "+info.xrpBalance);
      console.log(info);
    }).then(() => {
      console.log('getting account info for', this.state.FromAddress);
      return api.getTrustlines(this.state.FromAddress);
    }).then(trustlines => {
      self.setState({myTrustlines:trustlines});
      console.log(trustlines);
    }).then(() => {
      console.log('getting account info for', this.state.FromAddress);
      return api.getBalanceSheet(this.state.FromAddress);
    }).then(res => {
     
      console.log(res);

    }).then(() => {
     // return api.disconnect();
    }).then(() => {
      console.log('done and disconnected.');
    }).catch(console.error);
  }
  public account_currencies(){
    let self=this;
      api.request('account_currencies', {
      account: this.state.FromAddress
    }).then(response => {
       
       let CurrenciesYouCanSend=[];
       let CurrenciesYouCanReceive=[];
       if(response.receive_currencies !=undefined){
       CurrenciesYouCanReceive=(response.receive_currencies);
       CurrenciesYouCanReceive.push("XRP");
      }
       if(response.send_currencies !=undefined){
         if(response.send_currencies.length > 0)
        CurrenciesYouCanSend=(response.send_currencies);   
        CurrenciesYouCanSend.push("XRP");
      }
      let currency=[];
      CurrenciesYouCanSend.forEach((item)=>{
       currency.push({key:item,text:item});
      })
      self.setState({AccountCurrencies:response,CurrenciesDropdown:currency,
        CurrenciesYouCanReceive:CurrenciesYouCanReceive,CurrenciesYouCanSend:CurrenciesYouCanSend});
      console.log(response);
    }).catch(console.error);
  }
 public addTrustLines(){
  const trustline = {
    "currency": this.state.IssuedCurrency,
    "counterparty": this.state.Issuer,
    "limit": this.state.Limit,
    "ripplingDisabled": true,
    "frozen": false
  };
  api.connect().then(() => {
    console.log('Connected');
  return api.prepareTrustline(this.state.FromAddress,trustline);
  }).then(prepared => {
    console.log(prepared);
    return api.getLedger().then(ledger => {
      console.log('Current Ledger', ledger.ledgerVersion);
      return this.submitTransaction(ledger.ledgerVersion, prepared, this.state.Secret);
    });
  }).then(() => {
    api.disconnect().then(() => {
      console.log('api disconnected');     
    });
  }).catch(console.error);
   
 }
 public verifyTransaction(hash, options) {
  console.log('Verifying Transaction');
  toast.warn('Verifying Transaction');

  return api.getTransaction(hash, options).then(data => {
    toast.info('Validated in Ledger: '+ data.outcome.ledgerVersion);
    toast.info('Sequence: '+ data.sequence);
    toast.success('Final Result: '+ data.outcome.result);
    console.log('Final Result: ', data.outcome.result);
    this.setState({msg:'Final Result: '+ data.outcome.result});
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
 private submitTransaction(lastClosedLedgerVersion, prepared, secret) {
  const signedData =api.sign(prepared.txJSON, secret);
  return api.submit(signedData.signedTransaction).then(data => {
    toast.info('Tentative Result: '+ data.resultCode + ' .Tentative Message: ' +data.resultMessage);
    this.setState({msg:'Tentative Result: '+ data.resultCode + ' .Tentative Message: ' +data.resultMessage});
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
private _hidePanel = (): void => {
  this.setState({ showPanel: false,msg:"" });
}
private _showPanel = (): void => {
  this.setState({ showPanel: true });
}
private _textIssuedCurrencyChanged(newValue: string): void { 
  this.setState({IssuedCurrency: newValue}); 
} 
private _textIssuerChanged(newValue: string): void { 
  this.setState({Issuer: newValue}); 
}
private _textLimitChanged(newValue: string): void { 
  this.setState({Limit: newValue}); 
}
private _textFromAddressChanged(newValue: string): void { 
  this.setState({FromAddress: newValue}); 
}
private _textSecretChanged(newValue: string): void { 
  this.setState({Secret: newValue}); 
}
public showToast(msg,type){
  
  switch (type) {
    case 'warning': toast.warn(msg); break;
    case 'error': toast.error(msg); break;
    case 'success': toast.success(msg); break;
    default: toast.info(msg); break;
  }
}
  public render(): React.ReactElement<IRippleApiProps> {
    return (
      <div className={ styles.rippleApi }>
           
       <ToastContainer
position="top-right" autoClose={5000} hideProgressBar={false} newestOnTop={false} closeOnClick
rtl={false}  draggable pauseOnHover/>
{/* Same as */}
<ToastContainer />
        <div className={ styles.container }>
        <div className={styles.AppName}>Ripple {this.props.description}</div>
        <div className={styles.sectionheading}>Wallet Login</div>
        <div className={styles.grid} dir="ltr">
            <div className={styles.row}>
              <div className={styles.twocolumnlayout}>                  
                  <TextField label="Your Address" value={this.state.FromAddress} onChanged={this._textFromAddressChanged.bind(this)}/>
              </div>
              <div className={styles.twocolumnlayout}>                  
                  <TextField type="password"  label="Secret" value={this.state.Secret} onChanged={this._textSecretChanged.bind(this)}/>
              </div>
              <div className={styles.onecolumnlayout}>
                < PrimaryButton text="Refresh" onClick={this.run.bind(this)} className={styles.refresh} />
            
              </div>   
            </div>
            <div className={styles.sectionheading}>My Wallet</div>
            <div className={styles.row}> 
              <div className={styles.twocolumnlayout}>
                <div> <b>Your Address</b> </div> <div>{this.state.FromAddress}</div>  
              </div>
              <div className={styles.twocolumnlayout}>
                  <div> <b>Your XRP Balance</b> </div>
                 <div>{this.state.myAccount.xrpBalance} 
                     
                 </div>
              </div>
            </div>
            <div className={styles.row}> 
              <div className={styles.twocolumnlayout}>
                <div> <b>Currencies You Can Receive</b> </div>
                <div>{this.state.CurrenciesYouCanReceive.length>0 ? this.state.CurrenciesYouCanReceive.toString():""}</div>  
              </div>
              <div className={styles.twocolumnlayout}>
                  <div> <b>Currencies You Can Send </b> </div>
                  <div>{this.state.CurrenciesYouCanSend.length>0 ? this.state.CurrenciesYouCanSend.toString():""}</div>  
              
              </div>
            </div>
            
         
          <TransferXRP api={api} FromAddress={this.state.FromAddress} showToast={this.showToast.bind(this)}
           CurrenciesDropdown={this.state.CurrenciesDropdown} Secret={this.state.Secret} />
          {/*<Trustlines api={api} />*/}
            
        </div>
        <div className={styles.sectionheading}>TrustLines</div>
        <div className={styles.grid} dir="ltr">
            <div className={styles.row}>
              
           
              <div className={styles.onecolumnlayout}>
                    <div className={styles.trustheading}> 
                        <span className={styles.theading}>Trustlines ({this.state.myTrustlines.length})</span> 
                        <span className={styles.addtrust} onClick={this._showPanel.bind(this)}>Add TrustLine</span>
                    </div>
                        <table className={styles.trustlines}>
                          <tr><th>Currency</th><th>Counterparty</th><th>Balance</th><th>Limit</th></tr>
                              { this.state.myTrustlines.length > 0 && this.state.myTrustlines.map((item, index) => {
                                  return(<tr>
                                    <td>{item.specification.currency}</td>
                                    <td>{item.specification.counterparty}</td>
                                    <td>{item.state.balance}</td>
                                    <td>{item.specification.limit}</td>                    
                                    </tr>);
                                })
                              }
                        </table>
                        <Panel
                          isOpen={this.state.showPanel}
                          onDismiss={this._hidePanel}
                          type={PanelType.medium}
                          headerText={"Add Trustline"}
                          closeButtonAriaLabel="Close"
                          className={""}
                        >
                               <TextField label="Currency" value={this.state.IssuedCurrency} onChanged={this._textIssuedCurrencyChanged.bind(this)}/>
                               <TextField label="Issuer" value={this.state.Issuer} onChanged={this._textIssuerChanged.bind(this)}/>
                               <TextField label="Limit" value={this.state.Limit} onChanged={this._textLimitChanged.bind(this)}/>
                               < PrimaryButton text="Add" onClick={this.addTrustLines.bind(this)} className={styles.addTrustbtn} />
                           <div> {this.state.msg} </div>
                        </Panel>
               </div>
          
            </div>
       </div>
      </div>
    </div>
      
    );
  }
}
