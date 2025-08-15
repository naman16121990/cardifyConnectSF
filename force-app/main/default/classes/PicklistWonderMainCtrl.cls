/**
* @File Name : PicklistWonderMainCtrl.cls
* @Description :
* @Author :
* @Last Modified By :
* @Last Modified On : June 4, 2025
* @Modification Log :
*==============================================================================
* Ver | Date | Author | Modification
*==============================================================================
* 1.0 | June 4, 2025 | Naman Jangid | Initial Version
**/

public class PicklistWonderMainCtrl {
    @AuraEnabled(cacheable=true)
    public static List<ObjectData> getObjectData() {
		List<ObjectData> objectList = new List<ObjectData>();
		for(Schema.SObjectType o : Schema.getGlobalDescribe().values()) {
			System.debug(o.getDescribe().getName() + '' +o.getDescribe().getLabel());
			objectList.add(new ObjectData(o.getDescribe().getName(),o.getDescribe().getLabel()));
		}
        return objectList;
    }

    @AuraEnabled(cacheable=true)
    public static List<ObjectData> getRecordTypeNames(String sObjectName) {
        List<ObjectData> recordTypeNames = new List<ObjectData>();
        List<RecordType> recordTypeList = [Select Id,Name from RecordType where SobjectType = :sObjectName And IsActive = true];
		for(RecordType rt : recordTypeList){
			recordTypeNames.add(new ObjectData(rt.Id,rt.Name));
		}
        return recordTypeNames;
    }

    @AuraEnabled(cacheable=true)
	public static List<FieldDefinition> getPicklistOrder(String sObjectName){
		List<FieldDefinition> fieldDefinationList = [SELECT Id,DurableId,ControllingFieldDefinitionId,Label,QualifiedApiName FROM FieldDefinition WHERE EntityDefinition.QualifiedApiName = :sObjectName and DataType = 'Picklist' LIMIT 200];
        return fieldDefinationList;
	}

    @AuraEnabled(cacheable=true)
    public static String getPicklistValues(String objectName,String fieldNameList) {
        SObjectType objectType = Schema.getGlobalDescribe().get(objectName);
        Map<String,List<String>> picklistValuesMap = new Map<String,List<String>>();
        System.debug(objectName);
        System.debug(fieldNameList);
        for(String fieldName : (List<String>)JSON.deserialize(fieldNameList, List<String>.class)){
           System.debug(fieldName);
           Schema.DescribeFieldResult fieldResult = objectType.getDescribe().fields.getMap().get(fieldName).getDescribe();
           List<Schema.PicklistEntry> picklistValues = fieldResult.getPicklistValues();
        
           List<String> tempPicklistValues = new List<String>();
           for(Schema.PicklistEntry picklistVal : picklistValues) {
                // Access details of each picklist value
                String label = picklistVal.getLabel(); // Get the display label
                String value = picklistVal.getValue(); // Get the API name value
                Boolean isActive = picklistVal.isActive(); // Check if the value is active
                Boolean isDefault = picklistVal.isDefaultValue(); // Check if the value is the default
                //System.debug(label + ' - ' + value); // Example: Print the label and value
                tempPicklistValues.add(value);
        	}
            picklistValuesMap.put(fieldName,tempPicklistValues);
        }
        System.debug(picklistValuesMap);
        return JSON.serialize(picklistValuesMap);
    }
    
    public static void getFieldInTable() {
		List<FieldDefinition> parentList = [SELECT Id,DurableId,ControllingFieldDefinitionId,Label,QualifiedApiName FROM FieldDefinition 
                                        WHERE EntityDefinition.QualifiedApiName = 'Binarybespoke__c' and DataType = 'Picklist' 
                                        and ControllingFieldDefinitionId = null LIMIT 200];
        Set<String> parentDuraIdSet = new Set<String>();
        for(FieldDefinition df : parentList){
            parentDuraIdSet.add(df.DurableId);
        }
        
        List<FieldDefinition> childList = [SELECT Id,DurableId,ControllingFieldDefinitionId,Label,QualifiedApiName FROM FieldDefinition 
                                         WHERE EntityDefinition.QualifiedApiName = 'Binarybespoke__c' and DataType = 'Picklist' and
                                         ControllingFieldDefinitionId in :parentDuraIdSet LIMIT 200];//c1,c2...
        
        Map<String,List<FieldDefinition>> parentChildMap = new Map<String,List<FieldDefinition>>();
        Set<String> childDuraIdSet = new Set<String>();
        for(FieldDefinition df : childList){
            childDuraIdSet.add(df.DurableId);
            if(parentChildMap.containsKey(df.ControllingFieldDefinitionId)){
                parentChildMap.get(df.ControllingFieldDefinitionId).add(df);
            }else{
                List<FieldDefinition> tempFDList = new List<FieldDefinition>();
                tempFDList.add(df);
                parentChildMap.put(df.ControllingFieldDefinitionId,tempFDList);
            }
        }
        System.debug('parentChildMap--'+parentChildMap);//c1-gc1,gc2,c2-gc3,gc4...
        
        List<FieldDefinition> gcList = [SELECT Id,DurableId,ControllingFieldDefinitionId,Label,QualifiedApiName FROM FieldDefinition 
                                         WHERE EntityDefinition.QualifiedApiName = 'Binarybespoke__c' and DataType = 'Picklist' and
                                         ControllingFieldDefinitionId in :childDuraIdSet LIMIT 200];//c1,c2...

        Map<String,List<FieldDefinition>> childGcMap = new Map<String,List<FieldDefinition>>();
        for(FieldDefinition gchild : gcList){
            if(childGcMap.containsKey(gchild.ControllingFieldDefinitionId)){
                childGcMap.get(gchild.ControllingFieldDefinitionId).add(gchild);
            }else{
                List<FieldDefinition> tempFDList = new List<FieldDefinition>();
                tempFDList.add(gchild);
                childGcMap.put(gchild.ControllingFieldDefinitionId,tempFDList);
            }
        }
        
         //System.debug('childGcMap--'+childGcMap);
        
        for(FieldDefinition parent : parentList){
           String p = parent.Label!=null ? parent.Label : '';
             //System.debug('parentChildMap.get(parent.DurableId)--'+parentChildMap.get(parent.DurableId));
             for(FieldDefinition child : parentChildMap.get(parent.DurableId) ){
                    String c = child.Label!=null ? child.Label: '';
                    List<FieldDefinition> tempgcList =  childGcMap.get(child.DurableId);
                     if(tempgcList!=null){
                                for(FieldDefinition gchild : tempgcList){
                                    String gc = gchild.Label!=null ? gchild.Label: '' ;
                                    System.debug(p+'--'+c+'--'+gc);
                                } 
                     }else{
                               System.debug(p+'--'+c+'--');
                     }
              }
            
        }
        
    }
    
    public static void getFieldInTable2(){
        //PicklistWonderMainCtrl.getFieldInTable();
        String parent = 'Parent__c';
        String child = 'Child__c';
        String grandChild = 'Grandchild__c';
        String objectApiName = 'Binarybespoke__c';

        List<String> P = PicklistWonderMainCtrl.getPicklistValuesHelper(objectApiName,parent);
        List<String> C = PicklistWonderMainCtrl.getPicklistValuesHelper(objectApiName,child);
        List<String> GC = PicklistWonderMainCtrl.getPicklistValuesHelper(objectApiName,grandChild);
        System.debug(P);
        System.debug(C);
        System.debug(GC);
        
    }
    
   public static List<String> getPicklistValuesHelper(String objectName, String fieldName) {
     
        List<String> picklistValues = new List<String>();
        try {
            Schema.SObjectType sobjectType = Schema.getGlobalDescribe().get(objectName);
            if (sobjectType != null) {
                Schema.DescribeSObjectResult describe = sobjectType.getDescribe();
                Schema.SObjectField field = describe.fields.getMap().get(fieldName);
                if (field != null) {
                    Schema.DescribeFieldResult fieldDescribe = field.getDescribe();
                    if (fieldDescribe.getType() == Schema.DisplayType.Picklist || fieldDescribe.getType() == Schema.DisplayType.Multipicklist) {
                        List<Schema.PicklistEntry> picklistEntries = fieldDescribe.getPicklistValues();
                        for (Schema.PicklistEntry entry : picklistEntries) {
                            picklistValues.add(entry.getLabel());
                        }
                    }
                }
            }
        } catch (Exception e) {
            System.debug('Error retrieving picklist values: ' + e.getMessage());
        }
        return picklistValues;
    }
    
    public class PicklistOrder {
		@AuraEnabled
		public String parent {get; set;}
		@AuraEnabled
		public String child {get; set;}
        @AuraEnabled
		public String grandChild {get; set;}

		public PicklistOrder(String parent, String child) {
			this.parent = parent;
			this.child = child;
		}
	}

	public class ObjectData {
		@AuraEnabled
		public String objectApiName {get; set;}
		@AuraEnabled
		public String objectLabel {get; set;}

		public ObjectData(String objectApiName, String objectLabel) {
			this.objectApiName = objectApiName;
			this.objectLabel = objectLabel;
		}
	}
}