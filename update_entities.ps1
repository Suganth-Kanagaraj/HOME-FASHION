$entities = @("Category", "Customer", "CustomerSegment", "Expense", "Location", "MarketingCampaign", "Product", "ProductInventory", "Purchase", "Sale", "StockAdjustment", "StockMovement", "Supplier")

foreach ($e in $entities) {
    if (Test-Path -Path "entities\$e" -PathType Container) {
        Remove-Item -Recurse -Force "entities\$e"
    }
    Set-Content -Path "entities\$e.json" -Value "[]"
}
