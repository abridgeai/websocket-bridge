FROM us-docker.pkg.dev/abridge-artifact-registry/cgr/abridge.com/chainguard-private/node-fips:24@sha256:2ce422dd44b26b25d0dcca2cf9e3c06b6ded78517d5fea7be5ff4a81aa0df54e
WORKDIR /opt/riva/websocket-bridge
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 8009
CMD [ "node", "server.js" ]
