"use strict";

const assert = require("assert");
const {NConsumer, NProducer} = require("./../../index.js");
const {producerConfig, consumerConfig, topic} = require("./../nconfig.js");

describe("NSinek INT JSON (fast)", () => {

  let consumer = null;
  let producer = null;
  const consumedMessages = [];
  let firstMessageReceived = false;
  let messagesChecker;

  before(done => {

    producer = new NProducer(producerConfig);
    consumer = new NConsumer([topic], consumerConfig);

    producer.on("error", error => console.error(error));
    consumer.on("error", error => console.error(error));

    Promise.all([
      producer.connect(),
      consumer.connect()
    ]).then(() => {
      consumer.on("message", message => consumedMessages.push(message));
      consumer.consume(null, true, true).then(() => {
        firstMessageReceived = true;
      });
      setTimeout(done, 1000);
    });
  });

  after(done => {
    if(producer && consumer){
      producer.close();
      consumer.close(true); //commit
      setTimeout(done, 500);
    }
  });

  it("should be able to produce messages", () => {

    const promises = [
      producer.bufferFormatPublish(topic, "1", {content: "a message 1"}, 1, null, 0),
      producer.bufferFormatUpdate(topic, "2", {content: "a message 2"}, 1, null, 0),
      producer.bufferFormatUnpublish(topic, "3", {content: "a message 3"}, 1, null, 0)
    ];

    return Promise.all(promises);
  });

  it("should be able to wait", done => {
    messagesChecker = setInterval(()=>{
      if(consumedMessages.length >= 3){
        clearInterval(messagesChecker);
        done();
      }
    }, 500);
  });

  it("should have received first message", done => {
    assert.ok(firstMessageReceived);
    done();
  });

  it("should be able to consume messages", done => {
    //console.log(consumedMessages);
    assert.ok(consumedMessages.length);
    assert.equal(consumedMessages[0].value.payload.content, "a message 1");
    assert.equal(consumedMessages[1].value.payload.content, "a message 2");
    assert.equal(consumedMessages[2].value.payload.content, "a message 3");
    done();
  });
});