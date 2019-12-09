FROM loadimpact/k6

ENV CLIENT_NAME=
ENV CLIENT_ENDPOINT=
ENV CLIENT_VERSION=
ENV INFLUXDB_HOSTNAME=

ADD ./clients clients
ADD ./lib lib

ENTRYPOINT [ "/bin/sh" ]
CMD ["-c", "k6 run --vus=50 --duration=5m ./clients/${CLIENT_NAME}/stresstest.js --out influxdb=${INFLUXDB_HOSTNAME}/${CLIENT_NAME}-${CLIENT_VERSION}"]