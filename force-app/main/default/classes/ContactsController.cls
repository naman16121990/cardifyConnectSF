public with sharing class ContactsController {
    @AuraEnabled(cacheable=true)
    public static List<Account> fetchAccounts() {
        return [SELECT Id, Name FROM Account ORDER BY Name];
    }
    
    @AuraEnabled(cacheable=true)
    public static List<Contact> fetchContactsByAccount(Id accountId) {
        return [
            SELECT Id, FirstName, LastName, Email, Phone, QR_Code_Generated__c, Name, Title
            FROM Contact
            WHERE AccountId = :accountId
            ORDER BY LastName, FirstName
        ];
    }

    @AuraEnabled
    public static String cardifyContacts(List<Id> contactIds) {
        // 1. Query only specified contacts
        List<Contact> contacts = [
            SELECT Id, FirstName, LastName, Phone, Email, Account.Name, Title
            //, Website
            FROM Contact
            WHERE Id IN :contactIds
        ];

        // 2. Build JSON payload with required fields, including Id
        List<Map<String, Object>> contactList = new List<Map<String, Object>>();
        for (Contact c : contacts) {
            Map<String, Object> contactData = new Map<String, Object>{
                'id'          => c.Id,
                'fullName'    => (c.FirstName != null ? c.FirstName + ' ' : '') + (c.LastName != null ? c.LastName : ''),
                'mobile'      => c.Phone,
                'email'       => c.Email,
                'companyName' => c.Account != null ? c.Account.Name : null,
                'designation' => c.Title,
                'website'     => ''
            };
            contactList.add(contactData);
        }

        String jsonBody = JSON.serialize(contactList);

        // 3. Callout to Flask bulk endpoint
        HttpRequest req = new HttpRequest();
        req.setEndpoint('https://c7c96a65d433.ngrok-free.app/process_bulk_data');
        req.setMethod('POST');
        req.setHeader('Content-Type', 'application/json');
        req.setBody(jsonBody);

        Http http = new Http();
        HttpResponse res = http.send(req);

        // 4. Update QR_Code_Generated__c for successful records
        if (res.getStatusCode() == 200) {
            Map<String, Object> responseMap = (Map<String, Object>) JSON.deserializeUntyped(res.getBody());
            System.debug('responseMap-->'+JSON.serialize(responseMap));
            if (responseMap.containsKey('results')) {
                List<Object> results = (List<Object>) responseMap.get('results');
                List<Contact> contactsToUpdate = new List<Contact>();
                for (Object r : results) {
                    Map<String, Object> recordResult = (Map<String, Object>) r;
                    if ('success'.equalsIgnoreCase((String) recordResult.get('status')) && recordResult.containsKey('record_id')) {
                        Id contactId = (Id) recordResult.get('record_id');
                        contactsToUpdate.add(new Contact(
                            Id = contactId,
                            QR_Code_Generated__c = true
                        ));
                    }
                }
                if (!contactsToUpdate.isEmpty()) {
                    update contactsToUpdate;
                }
            }
        }

        return res.getBody();
    }



}