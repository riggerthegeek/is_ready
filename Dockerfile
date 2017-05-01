FROM node:6-alpine

WORKDIR /opt/is_ready
ADD . /opt/is_ready

ENV READY_ENDPOINT=""
ENV READY_EXPONENTIAL="false"
ENV READY_TIMEOUT="1000"
ENV READY_TRIES="10"

CMD node ./src/bin/ready.js check $READY_ENDPOINT --exponential=$READY_EXPONENTIAL --timeout=$READY_TIMEOUT --tries=$READY_TRIES
