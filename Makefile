duration=30s
users=10

test::
	CLIENT_ENDPOINT=$(endpoint) k6 run clients/$(client)/stresstest.js

stresstest::
	CLIENT_ENDPOINT=$(endpoint) k6 run --vus $(users) --duration $(duration) clients/$(client)/stresstest.js

.ONESHELL:
deploy:: node_modules
	cd infra
	pulumi stack select dev
	PULUMI_K8S_SUPPRESS_DEPRECATION_WARNINGS=true pulumi up --suppress-outputs

node_modules:
	helm repo update
	yarn