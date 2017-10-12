const fs = require('fs');
const { mjml2html } = require('mjml');
const amqplib = require('amqplib');
const mandrill = require('mandrill-api/mandrill');
const Handlebars = require('handlebars');

const config = require('./config.js');

const mandrillClient = new mandrill.Mandrill(config.mandrill.API_KEY);

async function buildTemplateMap() {
  try {
    const templateNames = fs.readdirSync('./templates');
    let templateMap = {};
    templateNames.forEach(async (fileName) => {
      try {
        const template = fs.readFileSync(`./templates/${fileName}`, 'utf8');
        let mjmlOutput = mjml2html();
        templateMap[fileName] =  Handlebars.precompile(mjmlOutput.html);
      } catch (err) { console.error(err); }
    });
    return templateMap;
  } catch (err) {
    console.error(err);
    return {};
  }
}

const templateMap = buildTemplateMap();

amqplib.connect(config.amqp.url)
  .then((conn) => conn.createChannel())
  .then((ch) => {
    return ch.assertQueue(config.amqp.queueName)
      .then((ok) => {
        return ch.consume(config.amqp.queueName, (msg) => {
          if (msg !== null) {
            ch.ack(msg);
            let email = JSON.parse(msg);
            const generatedHtml = Handlebars.template(templateMap[email.templateName], {
              toto: 'titi'
            });
          }
        });
      });
  })
  .catch(console.warn);
