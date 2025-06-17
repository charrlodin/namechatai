amecheap.domains.check
Checks the availability of domains

Example Request
https://api.namecheap.com/xml.response?ApiUser=apiexample&ApiKey=52b4c87ef7fd49cb96a915c0db68124&UserName=apiexample&Command=namecheap.domains.check&ClientIp=192.168.1.109&DomainList=us.xyz
Request Parameters
Global parameters are not shown here (for clarity), but they should be present in all requests.

Name Type MaxLength Required? Description
DomainList String
No
Yes Comma-separated list of domains to check
Example Response (regular domain)

<?xml version="1.0" encoding="utf-8"?>
<ApiResponse xmlns="http://api.namecheap.com/xml.response" Status="OK">
<Errors/>
<Warnings/>
<RequestedCommand>namecheap.domains.check</RequestedCommand>
<CommandResponse Type="namecheap.domains.check">
<DomainCheckResult Domain="testapi.xyz" Available="false" ErrorNo="0" Description="" IsPremiumName="false" PremiumRegistrationPrice="0" PremiumRenewalPrice="0" PremiumRestorePrice="0" PremiumTransferPrice="0" IcannFee="0" EapFee="0"/>
</CommandResponse>
<Server>PHX01APIEXT02</Server>
<GMTTimeDifference>--4:00</GMTTimeDifference>
<ExecutionTime>1.358</ExecutionTime>
</ApiResponse>
Example Response (premium domain)
<?xml version="1.0" encoding="utf-8"?>
<ApiResponse xmlns="http://api.namecheap.com/xml.response" Status="OK">
<Errors/>
<Warnings/>
<RequestedCommand>namecheap.domains.check</RequestedCommand>
<CommandResponse Type="namecheap.domains.check">
<DomainCheckResult Domain="us.xyz" Available="true" ErrorNo="0" Description="" IsPremiumName="true" PremiumRegistrationPrice="13000.0000" PremiumRenewalPrice="13000.0000" PremiumRestorePrice="65.0000" PremiumTransferPrice="13000.0000" IcannFee="0.0000" EapFee="0.0000"/>
</CommandResponse>
<Server>PHX01APIEXT01</Server>
<GMTTimeDifference>--4:00</GMTTimeDifference>
<ExecutionTime>2.647</ExecutionTime>
</ApiResponse>
Response Parameters
Name	Description
Domain	Domain name for which you wish to check availability
Available	Indicates whether the domain name is available for registration
IsPremiumName	Indicates whether the domain name is premium
PremiumRegistrationPrice	Registration Price for the premium domain
PremiumRenewalPrice	Renewal price for the premium domain
PremiumRestorePrice	Restore price for the premium domain
PremiumTransferPrice	Transfer price for the premium domain
IcannFee	Fee charged by ICANN
EapFee	Purchase fee for the premium domain during Early Access Program (EAP)*
*Currently, Namecheap does not support registration of premium domains during EAP via API.

Error Codes
Specifies the error codes that might be returned from this method

Number Description
3031510 Error response from Enom when the error count != 0
3011511 Unknown response from the provider
2011169 Only 50 domains are allowed in a single check command
