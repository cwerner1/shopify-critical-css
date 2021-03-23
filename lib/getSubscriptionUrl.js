const getSubscriptionUrl = async (accessToken, shop, returnUrl = process.env.HOST) => {
  const query = JSON.stringify({
    query: `mutation {
      appPurchaseOneTimeCreate(
        name: "Unlimited Use"
				price: { amount: 10, currencyCode: USD }
        test: true
        returnUrl: "${returnUrl}"
      )
      {
        userErrors {
          field
          message
        }
        confirmationUrl
        appPurchaseOneTime {
          id
        }
      }
    }`
  });

  const response = await fetch(`https://${shop}/admin/api/2020-10/graphql.json`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      "X-Shopify-Access-Token": accessToken,
    },
    body: query
  })

  const responseJson = await response.json();

  return responseJson.data.appPurchaseOneTimeCreate.confirmationUrl;
};

module.exports = getSubscriptionUrl;