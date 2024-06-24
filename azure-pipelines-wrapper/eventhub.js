const { EventHubProducerClient } = require("@azure/event-hubs");
const identity = require("@azure/identity");
const credential = new identity.DefaultAzureCredential();
const eventHubNamespace = "sonic-build.servicebus.windows.net";
const eventHubName = "githubevent";
var producer = null;

async function getProducer(){
    
    if (producer == null){
        producer = new EventHubProducerClient(eventHubNamespace, eventHubName, credential);
    };

    return producer;
}

async function sendEventBatch(eventDatas)
{
    if (producer == null){
        producer = new EventHubProducerClient(eventHubNamespace, eventHubName, credential);
    };
    const batch = await producer.createBatch();
    eventDatas.forEach(eventData => {
        if (!batch.tryAdd(eventData)){
            app.log.error("[ EVENTHUB ] Failed to add eventData");
        }
    });
    await producer.sendBatch(batch);
}

function init(app)
{
    app.log.info('eventhub init');
    app.onAny(async (context) => {
        app.log.info({timestamp: new Date().toISOString(), event: context.name, action: context.payload.action });
        console.log(`Log event ${context.name} ${context.payload.action} to event hubs`);

        var eventDatas = [];
        var eventData = {
            body: {"Timestamp": new Date().toISOString(), "Name": context.name, "Action": context.payload.action, "Payload": context.payload}
        };
        eventDatas.push(eventData);
        await sendEventBatch(eventDatas);
      });
}

module.exports = Object.freeze({
    init: init,
});