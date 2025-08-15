public with sharing class LicensePurchaseController {

    @AuraEnabled
    public static void purchaseLicenses(Id accountId, Integer internalQty, Integer referralQty) {
        if (accountId == null) {
            throw new AuraHandledException('Account Id is required');
        }

        Account acc = [
            SELECT Id, Internal_QR_Liscences__c, Referral_QR_Liscences__c
            FROM Account
            WHERE Id = :accountId
            LIMIT 1
        ];

        // Add purchased quantities to existing counts (handle nulls)
        acc.Internal_QR_Liscences__c = (acc.Internal_QR_Liscences__c != null ? acc.Internal_QR_Liscences__c : 0) + 
                                      (internalQty != null ? internalQty : 0);

        acc.Referral_QR_Liscences__c = (acc.Referral_QR_Liscences__c != null ? acc.Referral_QR_Liscences__c : 0) + 
                                      (referralQty != null ? referralQty : 0);

        update acc;
    }
}