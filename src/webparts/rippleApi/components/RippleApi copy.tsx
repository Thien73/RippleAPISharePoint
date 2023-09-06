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
const ToAddress='';
const api = new RippleAPI({server: strings.ServerName});
export default class RippleApi extends React.Component<IRippleApiProps, any> {
  constructor(props){
   super(props); 
   this.state={ToAddress:"ra6Yp1K3FMfkFT7mySZKrwppcprzXrkprH",FromAddress:strings.FromAddress,Amount:"",myAccount:{}};
  this.run();

  }
  async run() {
 
    var self=this;
    api.connect().then(() => {
      console.log('getting account info for', FromAddress);
      return api.getAccountInfo(FromAddress);
    }).then(info => {
      console.log(info);
      self.setState({myAccount:info});
      console.log('getAccountInfo done');
    }).then(() => {
     // return api.disconnect();
    }).then(() => {
      console.log('done and disconnected.');
    }).catch(console.error);
  }

  async sendXRP(){
   
    api.connect().then(() => {
   //   console.log('getting account info for', FromAddress);
     this.transact(api);
      //return api.getAccountInfo(FromAddress);
    })
    // Get ready to submit the payment
  
  }

  public async transact(api){
    const payment = {
      source: {
        address: FromAddress,
        maxAmount: {
          value: this.state.Amount+'.00',
          currency: 'XRP'
        }
      },
      destination: {
        address:this.state.ToAddress,
        amount: {
          value: this.state.Amount+'.00',
          currency: 'XRP'
        }
      }
    };
    const prepared = await api.preparePayment(FromAddress, payment, {
      maxLedgerVersionOffset: 5
    });
    // Sign the payment using the sender's secret
    const { signedTransaction } = api.sign(prepared.txJSON, FromSecret);
    console.log('Signed', signedTransaction) 
    // Submit the payment
    const res = await api.submit(signedTransaction);
    console.log('Done', res);
    if(res.resultCode.indexOf("SUCCESS")>0){
      alert(res.resultCode);
     // window.location.href=location.href;

    }
    //this.run();
  }
  private _textToAddressChanged(newValue: string): void { 
    this.setState({ToAddress: newValue}); 
  } 
  private _textAmountChanged(newValue: string): void { 
    this.setState({Amount: newValue}); 
  }
  private _transferAmtClicked(): void {
    console.log(this.state);
    this.sendXRP();
    alert('Clicked');
  }
  
  public render(): React.ReactElement<IRippleApiProps> {
    return (
      <div className={ styles.rippleApi }>
        <div className={ styles.container }>
        <div className={styles.grid} dir="ltr">
            <div className={styles.row}> 
              <div className={styles.twocolumnlayout}>
                <div> Your Address </div> <div>{strings.FromAddress}</div>  
              </div>
              <div className={styles.twocolumnlayout}>
                <div> Your Balance </div> <div>{this.state.myAccount.xrpBalance}</div>  
              </div>
            </div>
        <div className={styles.row}> 
            <div className={styles.twocolumnlayout}>                  
                <TextField label="From Address" value={this.state.FromAddress} readOnly/>
            </div>
            <div className={styles.twocolumnlayout}>
                <TextField label="To Address" value={this.state.ToAddress} onChanged={this._textToAddressChanged.bind(this)}/>
            </div>
            <div className={styles.twocolumnlayout}>
                <TextField type="number" min="0" label="Amount to transfer (In XRP)" onChanged={this._textAmountChanged.bind(this)}/>
            </div>
           
        </div>
        <div className={styles.row}>           
            <div className={styles.twocolumnlayout}>
            < PrimaryButton text="Transfer" onClick={this._transferAmtClicked.bind(this)}  />
            </div>
        </div>
        </div>
      </div>
    </div>
      
    );
  }
}
