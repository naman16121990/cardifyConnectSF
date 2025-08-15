import { LightningElement, track, wire, api } from 'lwc';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import createContactAndAccount from '@salesforce/apex/cardifyConnectController.createContactAndAccount';
import { getRecord } from 'lightning/uiRecordApi';

// API names of fields on Account object
const FIELDS = [
    'Account.Referral_QR_Liscences__c'
];

export default class QrCodeGenerator extends LightningElement {
    @track fullName = '';
    @track mobile = '+91'; // Default country code India
    @track email = '';
    @track companyName = '';
    @track designation = '';
    @track website = '';

    @track isLoading = false;

    @track isModalOpen = false;
    @track isAgreed = false;
    @track isLoading = false;

    @api recordId = '001gL00000GbdNmQAJ';

    externalLicenses;

    @wire(getRecord, { recordId: '$recordId', fields: FIELDS })
    wiredAccount({ error, data }) {
        if (data) {
            this.externalLicenses = data.fields.Referral_QR_Liscences__c.value;
        } else if (error) {
            // handle error (optional)
            console.error('Error fetching Account licenses:', error);
        }
    }

    // other tracked fields and methods for inputs...

    openModal() {
        this.isModalOpen = true;
    }

    closeModal() {
        this.isModalOpen = false;
    }

    handleAgreeChange(event) {
        this.isAgreed = event.target.checked;
    }

    handleSubmit() {
        if (!this.isAgreed) {
            this.showToast('error', 'Error', 'You must agree to the Terms and Conditions before proceeding.');
            return;
        }

        // Your existing validation and submission logic here
    }

    handleInputChange(event) {
        const field = event.target.dataset.id;
        if (field) {
            this[field] = event.target.value;
        }
    }

    handleSubmit() {
        if (!this.fullName || !this.mobile || !this.email || !this.companyName) {
            this.showToast('error', 'Error', 'Please fill in all required fields');
            return;
        }

        this.isLoading = true;

        // Prepare payload for external API call
        const payload = {
            fullName: this.fullName,
            mobile: this.mobile,
            email: this.email,
            companyName: this.companyName,
            designation: this.designation,
            website: this.website
        };
        

        // Call your external API first (replace URL)
        fetch('https://5742e9b0b4f9.ngrok-free.app/process_data', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        })
        .then(response => {
            console.log('response--',response.ok)
            if (response.ok) {
                this.showToast('success', 'Success', 'QR is sent and record created successfully');
            }else{
                throw new Error('Failed to send QR');
            }
            console.log(JSON.stringify(response))
            return response.json();
        })
        /*.then(() => {
            // Call Apex method to create Account and Contact
            return createContactAndAccount({
                fullName: this.fullName,
                mobile: this.mobile,
                email: this.email,
                companyName: this.companyName,
                designation: this.designation,
                website: this.website
            });
        })
        .then(() => {
            this.showToast('success', 'Success', 'QR is sent and records created successfully');
            this.resetForm();
        })*/
        .catch(error => {
            console.log('error--',error)
            this.showToast('error', 'Error', error.message);
        })
        .finally(() => {
            this.isLoading = false;
        });
    }

    showToast(variant, title, message) {
        const event = new ShowToastEvent({
            title,
            message,
            variant,
            mode: 'dismissable'
        });
        this.dispatchEvent(event);
    }

    resetForm() {
        this.fullName = '';
        this.mobile = '+91';
        this.email = '';
        this.companyName = '';
        //this.designation = '';
        this.website = '';

        const inputs = this.template.querySelectorAll('lightning-input');
        inputs.forEach(input => input.value = '');
    }

    
}