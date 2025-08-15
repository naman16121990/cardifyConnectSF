/**
* @File Name : cardifyConnectController.cls
* @Description :
* @Author :
* @Last Modified By :
* @Last Modified On : August 7, 2025
* @Modification Log :
*==============================================================================
* Ver | Date | Author | Modification
*==============================================================================
* 1.0 | August 7, 2025 |   | Initial Version
**/

public with sharing class cardifyConnectController {

    @AuraEnabled
    public static void createContactAndAccount(String fullName, String mobile, String email, String companyName, String designation, String website) {
        // Split fullName into first and last name (simple approach)
        String firstName = '';
        String lastName = '';
        if (fullName != null && fullName.trim() != '') {
            List<String> names = fullName.trim().split(' ');
            firstName = names.size() > 0 ? names[0] : '';
            //lastName = names.size() > 1 ? String.join(names.subList(1, names.size()), ' ') : ' ';
        } else {
            firstName = 'Unknown';
            lastName = ' ';
        }

        // Create Account
        Account acc = new Account(
            Name = companyName,
            Website = website
        );
        insert acc;

        // Create Contact linked to Account
        Contact con = new Contact(
            FirstName = firstName,
            LastName = lastName,
            Email = email,
            Phone = mobile,
            AccountId = acc.Id,
            Title = designation
        );
        insert con;
    }
}