@description('Name for the Azure Static Web App.')
param siteName string

@description('Azure region for the resource.')
param location string = 'eastus2'

@description('SKU tier. Use Free for personal projects or Standard for custom domains + SLAs.')
@allowed(['Free', 'Standard'])
param sku string = 'Free'

resource staticWebApp 'Microsoft.Web/staticSites@2023-01-01' = {
  name: siteName
  location: location
  sku: {
    name: sku
    tier: sku
  }
  properties: {
    // Source-code integration is handled by the ADO pipeline via the
    // AzureStaticWebApp@0 task using the deployment token, so we leave
    // repositoryUrl / branch blank here.
  }
}

@description('Deployment token used by the AzureStaticWebApp pipeline task.')
output deploymentToken string = staticWebApp.listSecrets().properties.apiKey
