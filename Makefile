duration=30s
users=10

test:: 
	CLIENT_ENDPOINT=$(endpoint) k6 run clients/$(client)/stresstest.js

stresstest:: 
	CLIENT_ENDPOINT=$(endpoint) k6 run --vus $(users) --duration $(duration) clients/$(client)/stresstest.js --out json=results.json

testall:
	node test-all-endpoints.js
