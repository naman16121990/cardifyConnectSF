// numberWidget.js
    import { LightningElement, api } from 'lwc';

    export default class NumberWidget extends LightningElement {
        @api widgetTitle = 'Executive Referral Licenses';
        @api displayValue = 50;
        @api formatStyle = 'decimal'; // 'decimal', 'currency', 'percent'
        @api maxFractionDigits = 0;
        @api minFractionDigits = 0;
        @api footerText = 'Remaining';


        // Example: If you need to fetch data for displayValue
        // connectedCallback() {
        //     // Fetch data or set initial value here
        //     this.displayValue = 12345.67;
        // }
    }