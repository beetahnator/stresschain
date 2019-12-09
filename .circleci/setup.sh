#!/bin/bash

# install prereqs
apt update && apt -y install wget

# install helm
curl -s https://get.helm.sh/helm-v2.14.3-linux-amd64.tar.gz | tar -xvz -C /tmp && \
    mv /tmp/linux-amd64/helm /bin && \
    rm -Rf /tmp/linux-amd64 && \
    helm init --client-only

# Add yarn linkable packages
git clone https://github.com/mazamats/pulumi-grafana && \
    cd pulumi-grafana/sdk/nodejs && \
    sed -i "s/\${VERSION}/0.0.1/g" package.json && \
    yarn link


git clone https://github.com/mazamats/pulumi-influxdb && \
    cd pulumi-influxdb/sdk/nodejs && \
    sed -i "s/\${VERSION}/0.0.1/g" package.json && \
    yarn link

# Install binary providers
cd /bin && \
    wget --continue \
      -c https://github.com/mazamats/pulumi-grafana/releases/download/v0.0.1/pulumi-resource-grafana.linux && \
      mv pulumi-resource-grafana.linux pulumi-resource-grafana && \
    wget --continue \
      -c https://github.com/mazamats/pulumi-influxdb/releases/download/v0.0.1/pulumi-resource-influxdb.linux && \
      mv pulumi-resource-influxdb.linux pulumi-resource-influxdb

chmod +x /bin/pulumi-resource-*
