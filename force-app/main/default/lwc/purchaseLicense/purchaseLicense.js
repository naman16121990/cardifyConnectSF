import { LightningElement, track, api, wire } from 'lwc';
import purchaseLicenses from '@salesforce/apex/LicensePurchaseController.purchaseLicenses';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import { refreshApex } from '@salesforce/apex';
import { getRecord } from 'lightning/uiRecordApi';

// API names of fields on Account object
const FIELDS = [
    'Account.Internal_QR_Liscences__c',
    'Account.Referral_QR_Liscences__c'
];


export default class PurchaseLicense extends LightningElement {
    @track internalQty = 5;
    @track referralQty = 0;
    internalRate = 600;
    referralRate = 1000;
    gstRate = 0.18; // 18%

    @api recordId = '001gL00000GbdNmQAJ';  // Account record Id, passed from parent or page context

    internalLicenses;
    referralLicenses;

    @wire(getRecord, { recordId: '$recordId', fields: FIELDS })
    wiredAccount({ error, data }) {
        if (data) {
            this.internalLicenses = data.fields.Internal_QR_Liscences__c.value;
            this.referralLicenses = data.fields.Referral_QR_Liscences__c.value;
        } else if (error) {
            // handle error (optional)
            console.error('Error fetching Account licenses:', error);
        }
    }

    get internalSubtotal() { return this.internalQty * this.internalRate; }
    get referralSubtotal() { return this.referralQty * this.referralRate; }
    get gstAmount() { return ((this.internalSubtotal + this.referralSubtotal) * this.gstRate).toFixed(2); }
    get totalAmount() { return (this.internalSubtotal + this.referralSubtotal + parseFloat(this.gstAmount)).toFixed(2); }
    get payLabel() { return `Pay ₹ ${this.totalAmount}`; }

    get isPayDisabled() {
        return (
            (this.internalQty < 10 && this.referralQty < 5) ||
            (this.internalSubtotal + this.referralSubtotal) === 0
        );
    }

    handlePayment() {
        alert(`Proceed to payment for ₹${this.totalAmount}`);
        purchaseLicenses({
            accountId: this.recordId,
            internalQty: this.internalQty,
            referralQty: this.referralQty
        })
        .then(() => {
            this.dispatchEvent(
                new ShowToastEvent({
                    title: 'Success',
                    message: 'Licenses purchased and account updated successfully.',
                    variant: 'success'
                })
            );
            // Refresh page after short delay
            setTimeout(() => {
                window.location.reload();
            }, 1000);
        })
        .catch(error => {
            this.dispatchEvent(
                new ShowToastEvent({
                    title: 'Error purchasing licenses',
                    message: error.body.message,
                    variant: 'error'
                })
            );
        });
    }

    handleInternalQtyChange(event) {
        this.internalQty = isNaN(parseInt(event.target.value, 10)) ? 0 : parseInt(event.target.value, 10);
    }

    handleReferralQtyChange(event) {
        this.referralQty = isNaN(parseInt(event.target.value, 10)) ? 0 : parseInt(event.target.value, 10);
    }

    // Computed: subtotals
    get internalSubtotal() {
        return this.internalQty * this.internalRate;
    }

    get referralSubtotal() {
        return this.referralQty * this.referralRate;
    }

    // GST on combined subtotal
    get gstAmount() {
        return ((this.internalSubtotal + this.referralSubtotal) * this.gstRate).toFixed(2);
    }

    // Total amount including GST
    get totalAmount() {
        return (this.internalSubtotal + this.referralSubtotal + parseFloat(this.gstAmount)).toFixed(2);
    }

    // Pay button label
    get payLabel() {
        return `Pay ₹ ${this.totalAmount}`;
    }

    // Disable pay if quantities below minimum or zero total
    get isPayDisabled() {
        return (
            (this.internalQty < 10 ) ||
            (this.internalSubtotal + this.referralSubtotal) === 0
        );
    }

    handleInternalQtyChange(event) {
        const value = parseInt(event.target.value, 10);
        this.internalQty = isNaN(value) ? 0 : value;
    }

    handleReferralQtyChange(event) {
        const value = parseInt(event.target.value, 10);
        this.referralQty = isNaN(value) ? 0 : value;
    }

}