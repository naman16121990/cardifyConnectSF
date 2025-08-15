import { LightningElement, track } from 'lwc';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import fetchAccounts from '@salesforce/apex/ContactsController.fetchAccounts';
import fetchContactsByAccount from '@salesforce/apex/ContactsController.fetchContactsByAccount';
import cardifyContacts from '@salesforce/apex/ContactsController.cardifyContacts';

const columns = [
    {
        label: 'Contact Name',
        fieldName: 'contactUrl',
        type: 'url',
        typeAttributes: {
            label: { fieldName: 'Name' }, // Use your field for display
            target: '_blank'
        },
        sortable: true
    },
    { label: 'First Name', fieldName: 'FirstName', sortable: true },
    { label: 'Last Name', fieldName: 'LastName', sortable: true },
    { label: 'Title', fieldName: 'Title', sortable: true },
    { label: 'Primary Phone', fieldName: 'Phone', type: 'phone', sortable: true },
    { label: 'Email', fieldName: 'Email', type: 'email', sortable: true },
    { label: 'QR Generated', fieldName: 'QR_Code_Generated__c', type: 'boolean', sortable: true }
];

export default class ContactSelector extends LightningElement {
    @track accountOptions = [];
    @track selectedAccountId = '';
    @track contacts = [];
    @track filteredContacts = [];
    @track contactsError;
    @track searchKey = '';
    @track selectedContactIds = [];
    @track sortBy = '';
    @track sortDirection = 'asc';
    columns = columns;

    connectedCallback() {
        this.loadAccounts();
    }

    loadAccounts() {
        fetchAccounts()
            .then(result => {
                this.accountOptions = result.map(acc => ({
                    label: acc.Name,
                    value: acc.Id
                }));
            })
            .catch(error => {
                this.accountOptions = [];
                console.error('Error loading accounts', error);
            });
    }

    handleAccountChange(event) {
        this.selectedAccountId = event.detail.value;
        this.selectedContactIds = [];
        this.searchKey = '';
        if(this.selectedAccountId) {
            this.loadContacts();
        } else {
            this.contacts = [];
            this.filteredContacts = [];
        }
    }

    loadContacts() {
        fetchContactsByAccount({ accountId: this.selectedAccountId })
            .then(result => {
                this.contacts = result;
                this.contacts = result.map(c => ({
                    ...c,
                    contactUrl: '/' + c.Id,
                    Name: (c.FirstName ? c.FirstName + ' ' : '') + (c.LastName || '')
                }));
                this.filteredContacts = [...this.contacts];
                this.sortBy = '';
                this.sortDirection = 'asc';
            })
            .catch(error => {
                this.contactsError = error.body ? error.body.message : error.message;
                this.contacts = [];
                this.filteredContacts = [];
            });
    }

    handleSort(event) {
        this.sortBy = event.detail.fieldName;
        this.sortDirection = event.detail.sortDirection;
        this.sortData(this.sortBy, this.sortDirection);
    }

    sortData(fieldname, direction) {
        let parseData = [...this.filteredContacts];
        let keyValue = (a) => (a[fieldname] ? a[fieldname].toString().toLowerCase() : '');
        let isReverse = direction === 'asc' ? 1 : -1;
        parseData.sort((x, y) => {
            x = keyValue(x);
            y = keyValue(y);
            return isReverse * ((x > y) - (y > x));
        });
        this.filteredContacts = parseData;
    }

    handleSearchKeyChange(event) {
        this.searchKey = event.target.value.toLowerCase();
        this.filterContacts();
    }

    filterContacts() {
        if(!this.searchKey) {
            this.filteredContacts = [...this.contacts];
            if(this.sortBy) this.sortData(this.sortBy, this.sortDirection);
            return;
        }

        this.filteredContacts = this.contacts.filter(c =>
            (c.FirstName && c.FirstName.toLowerCase().includes(this.searchKey)) ||
            (c.LastName && c.LastName.toLowerCase().includes(this.searchKey)) ||
            (c.Email && c.Email.toLowerCase().includes(this.searchKey)) ||
            (c.Title && c.Title.toLowerCase().includes(this.searchKey)) ||
            (c.Phone && c.Phone.toLowerCase().includes(this.searchKey)) ||
            (c.QR_Code_Generated__c && c.QR_Code_Generated__c.toLowerCase().includes(this.searchKey)) 
        );

        if(this.sortBy) this.sortData(this.sortBy, this.sortDirection);
    }

    handleRowSelection(event) {
        this.selectedContactIds = event.detail.selectedRows.map(row => row.Id);
    }

    get isCardifyDisabled() {
        return this.selectedContactIds.length === 0;
    }

    handleCardifyAll() {
        if (this.selectedContactIds.length === 0) return;
        cardifyContacts({ contactIds: this.selectedContactIds })
            .then(result => {
                // Show success toast on successful API call
                this.dispatchEvent(
                    new ShowToastEvent({
                        title: 'Success',
                        message: 'Card successfully generated for selected contacts.',
                        variant: 'success'
                    })
                );
            })
            .catch(error => {
                // Show error toast
                this.dispatchEvent(
                    new ShowToastEvent({
                        title: 'Error',
                        message: 'Error occurred while generating cards.',
                        variant: 'error'
                    })
                );
            });
    }

}