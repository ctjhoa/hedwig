const fs = require('fs');
const { mjml2html } = require('mjml');
const amqplib = require('amqplib');
const mandrill = require('mandrill-api/mandrill');
const Handlebars = require('handlebars');

const config = require('./config.js');

const mandrillClient = new mandrill.Mandrill(config.mandrill.API_KEY);

function buildTemplateMap() {
  const templateNames = fs.readdirSync('./templates');
  let templateSpecMap = {};
  templateNames.forEach((fileName) => {
    const template = fs.readFileSync(`./templates/${fileName}`, 'utf8');
    let mjmlOutput = mjml2html(template);
    templateSpecMap[fileName] =  mjmlOutput.html;
  });
  return templateSpecMap;
}

const templateSpecMap = buildTemplateMap();

amqplib.connect(config.amqp.url)
  .then((conn) => {
    process.once('SIGINT', conn.close.bind(conn));
    return conn.createChannel();
  })
  .then((ch) => {
    return ch.assertQueue(config.amqp.queueName, { durable: true, autoDelete: true })
      .then((ok) => {
        return ch.consume(config.amqp.queueName, (msg) => {
          if (msg !== null) {
            ch.ack(msg);
            let email = JSON.parse(msg.content.toString('utf8'));
            const template = Handlebars.compile(templateSpecMap[email.templateName]);
            const generatedHtml = template(email.data);
            console.log(generatedHtml);
          }
        });
      });
  })
  .catch(console.warn);
