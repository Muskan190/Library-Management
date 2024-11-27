const amqp = require("amqplib");

class Rabbit {
  constructor() {
    this.Connect();
    this.channel = null;
    this.QUEUE_NAME = "hii";
    this.saveData = null;
  }
  async Connect() {
    try {
      const connection = await amqp.connect("amqp://localhost");
      this.channel = await connection.createChannel();
      console.log("Channel is ready");
      await this.channel.assertQueue(this.QUEUE_NAME, { durable: false });
      console.log("Queue is ready");
    } catch (error) {
      console.log("error is ", error);
      throw error;
    }
  }
  async SendMessage(message) {
    try {
      if (this.channel) {
        this.channel.sendToQueue(this.QUEUE_NAME, Buffer.from(message));
        console.log(`we have send ${message} to queue ${this.QUEUE_NAME}`);
      } else {
        console.log("Channel not properly generated!!");
      }
    } catch (error) {
      console.log("Error is ", error);
      throw error;
    }
  }
  async ReceiveMessage() {
    try {
      if (this.channel) {
        await this.channel.consume(
          this.QUEUE_NAME,
          (msg) => {
            if (msg != null) {
              this.saveData = JSON.parse(msg.content);
              console.log(`mesage is ${msg.content}`);
            }
          },
          {
            noAck: true,
          }
        );
        return this.saveData;
      } else {
        console.log("Please Check Channel properly");
        throw "Please check connection";
      }
    } catch (error) {
      console.log("Error is ", error);
      throw error;
    }
  }
}
module.exports = Rabbit;
