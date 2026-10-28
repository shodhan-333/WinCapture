targetScope = 'resourceGroup'

@description('Globally unique, lowercase App Service name.')
param appName string
@description('Globally unique lowercase storage account name (3-24 letters/numbers).')
param storageName string
param sqlServerName string
param databaseName string = 'WinCapture'
param appServicePlanName string
param location string = resourceGroup().location
param tenantId string
param entraApiClientId string
param sqlEntraAdminObjectId string
param sqlEntraAdminName string
@allowed([ 'B1', 'S1' ])
param appServiceSku string = 'B1'
@allowed([ 'Basic', 'S0', 'S1' ])
param databaseSku string = 'Basic'

var vnetName = '${appName}-vnet'
var integrationSubnetName = 'appservice-integration'
var integrationSubnetId = resourceId('Microsoft.Network/virtualNetworks/subnets', vnetName, integrationSubnetName)

resource vnet 'Microsoft.Network/virtualNetworks@2024-05-01' = {
  name: vnetName
  location: location
  properties: {
    addressSpace: { addressPrefixes: ['10.42.0.0/16'] }
    subnets: [
      {
        name: integrationSubnetName
        properties: {
          addressPrefix: '10.42.0.0/24'
          delegations: [
            { name: 'appservice', properties: { serviceName: 'Microsoft.Web/serverFarms' } }
          ]
          serviceEndpoints: [ { service: 'Microsoft.Storage' } ]
        }
      }
    ]
  }
}

resource plan 'Microsoft.Web/serverfarms@2024-04-01' = {
  name: appServicePlanName
  location: location
  kind: 'linux'
  sku: { name: appServiceSku, tier: appServiceSku == 'B1' ? 'Basic' : 'Standard' }
  properties: { reserved: true }
}

resource sqlServer 'Microsoft.Sql/servers@2023-08-01' = {
  name: sqlServerName
  location: location
  properties: { minimalTlsVersion: '1.2', publicNetworkAccess: 'Enabled' }
}

resource sqlAdmin 'Microsoft.Sql/servers/administrators@2023-08-01' = {
  parent: sqlServer
  name: 'ActiveDirectory'
  properties: {
    administratorType: 'ActiveDirectory'
    principalType: 'User'
    login: sqlEntraAdminName
    sid: sqlEntraAdminObjectId
    tenantId: tenantId
  }
}

resource database 'Microsoft.Sql/servers/databases@2023-08-01' = {
  parent: sqlServer
  name: databaseName
  location: location
  sku: { name: databaseSku, tier: databaseSku == 'Basic' ? 'Basic' : 'Standard' }
  properties: { zoneRedundant: false }
}

resource storage 'Microsoft.Storage/storageAccounts@2023-05-01' = {
  name: storageName
  location: location
  sku: { name: 'Standard_LRS' }
  kind: 'StorageV2'
  properties: {
    minimumTlsVersion: 'TLS1_2'
    allowBlobPublicAccess: false
    allowSharedKeyAccess: false
    publicNetworkAccess: 'Enabled'
    supportsHttpsTrafficOnly: true
    networkAcls: {
      bypass: 'None'
      defaultAction: 'Deny'
      virtualNetworkRules: [ { id: integrationSubnetId, action: 'Allow' } ]
      ipRules: []
    }
  }
}

resource blobService 'Microsoft.Storage/storageAccounts/blobServices@2023-05-01' = {
  parent: storage
  name: 'default'
}

resource container 'Microsoft.Storage/storageAccounts/blobServices/containers@2023-05-01' = {
  parent: blobService
  name: 'wincapture'
  properties: { publicAccess: 'None' }
}

resource workspace 'Microsoft.OperationalInsights/workspaces@2023-09-01' = {
  name: '${appName}-logs'
  location: location
  properties: { retentionInDays: 30, features: { enableLogAccessUsingOnlyResourcePermissions: true } }
  sku: { name: 'PerGB2018' }
}

resource appInsights 'Microsoft.Insights/components@2020-02-02' = {
  name: '${appName}-insights'
  location: location
  kind: 'web'
  properties: { Application_Type: 'web', WorkspaceResourceId: workspace.id }
}

resource app 'Microsoft.Web/sites@2024-04-01' = {
  name: appName
  location: location
  kind: 'app,linux'
  identity: { type: 'SystemAssigned' }
  properties: {
    serverFarmId: plan.id
    httpsOnly: true
    virtualNetworkSubnetId: integrationSubnetId
    siteConfig: {
      linuxFxVersion: 'DOTNETCORE|10.0'
      alwaysOn: true
      ftpsState: 'Disabled'
      minTlsVersion: '1.2'
      healthCheckPath: '/health/ready'
      http20Enabled: true
      appSettings: [
        { name: 'ASPNETCORE_ENVIRONMENT', value: 'Production' }
        { name: 'ASPNETCORE_FORWARDEDHEADERS_ENABLED', value: 'true' }
        { name: 'AllowedHosts', value: '${appName}.azurewebsites.net' }
        { name: 'AzureAd__Instance', value: 'https://login.microsoftonline.com/' }
        { name: 'AzureAd__TenantId', value: tenantId }
        { name: 'AzureAd__ClientId', value: entraApiClientId }
        { name: 'ConnectionStrings__WinCaptureDatabase', value: 'Server=tcp:${sqlServer.name}.database.windows.net,1433;Database=${database.name};Authentication=Active Directory Managed Identity;Encrypt=True;TrustServerCertificate=False;Connection Timeout=30;' }
        { name: 'Storage__ServiceUri', value: 'https://${storage.name}.blob.core.windows.net' }
        { name: 'Storage__ContainerName', value: container.name }
        { name: 'Cors__AllowedOrigins__0', value: 'https://${appName}.azurewebsites.net' }
        { name: 'APPLICATIONINSIGHTS_CONNECTION_STRING', value: appInsights.properties.ConnectionString }
      ]
    }
  }
  dependsOn: [ vnet, sqlAdmin, container, appInsights ]
}

resource blobRole 'Microsoft.Authorization/roleAssignments@2022-04-01' = {
  name: guid(storage.id, app.id, 'storage-blob-data-contributor')
  scope: storage
  properties: {
    roleDefinitionId: subscriptionResourceId('Microsoft.Authorization/roleDefinitions', 'ba92f5b4-2d11-453d-a403-e96b0029c9fe')
    principalId: app.identity.principalId
    principalType: 'ServicePrincipal'
  }
}

resource sqlFirewall 'Microsoft.Sql/servers/firewallRules@2023-08-01' = [for (ip, i) in split(app.properties.outboundIpAddresses, ','): {
  parent: sqlServer
  name: 'WinCaptureAppService${i}'
  properties: { startIpAddress: ip, endIpAddress: ip }
}]

output appUrl string = 'https://${app.properties.defaultHostName}'
output appManagedIdentityPrincipalId string = app.identity.principalId
output sqlServerFqdn string = sqlServer.properties.fullyQualifiedDomainName
output storageBlobEndpoint string = storage.properties.primaryEndpoints.blob
output staticSitePath string = 'React at /; Angular Albums at /angular/albums; API at /api/*'
