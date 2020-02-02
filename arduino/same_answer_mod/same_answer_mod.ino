
#include "iClickerEmulator.h"
#include <RingBufCPP.h>
#include <string.h>

/* UPDATE THESE FOR YOUR PARTICULAR BOARD */
#define IS_RFM69HW false //make true if using w version
#define IRQ_PIN 3 // This is 3 on adafruit feather
#define CSN 8 // This is 8 on adafruit feather
/* END THINGS YOU MUST UPDATE */


#define MAX_BUFFERED_PACKETS 50

#define THRESHOLD 1000
#define MAX_RECVD 500

#define RAND_LOW 35
#define RAND_HIGH 75
iClickerAnswerPacket recvd[MAX_RECVD];
uint32_t num_recvd = 0;
char channel[2];
String inputString = "";
bool stringComplete = false;



iClickerEmulator clicker(CSN, IRQ_PIN, digitalPinToInterrupt(IRQ_PIN), IS_RFM69HW);
RingBufCPP<iClickerPacket, MAX_BUFFERED_PACKETS> recvBuf;

void setup()
{
  Serial.begin(115200);
    inputString.reserve(100);
  //Serial.println("working");
  clicker.begin(iClickerChannels::AB);
  // enter promiscouse mode on sending channel
  clicker.startPromiscuous(CHANNEL_SEND, recvPacketHandler);
  delay(1000);
  Serial.println("Ready!\nr: Reset Capture\na-e: Submit\ns: Start Capture\nt: Stop Capture\nf: Random id answers\nu: Uniform submit\np: Print");
}

void serialEvent() {
  while (Serial.available()) {
    // get the new byte:
    char inChar = (char)Serial.read();
    // add it to the inputString:
    inputString += inChar;
    // if the incoming character is a newline, set a flag so the main loop can
    // do something about it:
    if (inChar == '\n') {
      stringComplete = true;
    }
  }
}

void loop()
{
  char tmp[100];
  iClickerPacket r;

  static iClickerAnswerPacket old = {{0, 0,0, 0}, ANSWER_A};
  static uint32_t old_t = 0;

  //see if there is a pending packet, check if its an answer packet
  //see if different than pre packet
  while (recvBuf.pull(&r) && r.type == PACKET_ANSWER && (memcmp(&r.packet.answerPacket, &old, sizeof(old)) || millis() - old_t > THRESHOLD)) {
    uint8_t *id = r.packet.answerPacket.id;
    char answer = iClickerEmulator::answerChar(r.packet.answerPacket.answer);
    old = r.packet.answerPacket;
    old_t = millis();
    updateRef(r.packet.answerPacket);
    snprintf(tmp, sizeof(tmp), "%lu-%c-%02X%02X%02X%02X", num_recvd, answer, id[0], id[1], id[2], id[3]);
    Serial.println(tmp);
  }

  if (stringComplete) {
    const char * c = inputString.c_str();
    sscanf(c, "%c%c", &channel[0], &channel[1]);
    clicker.setChannel(getChannelByString(channel));
    inputString = "";
    stringComplete = false;
  }

  delay(100);

}


void recvPacketHandler(iClickerPacket *recvd)
{
  bool ret = recvBuf.add(*recvd);
}


void updateRef(iClickerAnswerPacket p)
{
  uint32_t i = 0;
  for (i = 0; i < num_recvd; i++)
  {
    if (!memcmp(recvd[i].id, p.id, ICLICKER_ID_LEN))
    {
      //update
      recvd[i] = p;
      break;
    }
  }

  //not found and space
  if (i == num_recvd && num_recvd < MAX_RECVD) {
    recvd[num_recvd++] = p;
  }

}

static iClickerChannel getChannelByString(const char *const str) // Created by GitHub user charlescao460.
{
  uint16_t index = (str[0] - 'A') * 4 + (str[1] - 'A'); //Calculate channel index in channels[] array
  if (index > NUM_ICLICKER_CHANNELS - 1 || index < 0)
    return iClickerChannels::channels[0]; //return AA if illegal input
  return iClickerChannels::channels[index];
}

void printCap()
{
  Serial.println("********BEGIN DUMP********");
  char tmp[100];
  uint16_t res[NUM_ANSWER_CHOICES] = { 0 };
  for (uint32_t i = 0; i < num_recvd; i++)
  {
    res[recvd[i].answer]++;
    char answer = iClickerEmulator::answerChar(recvd[i].answer);
    snprintf(tmp, sizeof(tmp), "Captured[%lu]: %c (%02X, %02X, %02X, %02X)", i, answer,
             recvd[i].id[0], recvd[i].id[1], recvd[i].id[2], recvd[i].id[3]);
    Serial.println(tmp);
  }

  snprintf(tmp, sizeof(tmp), "Results:\nA: %u\nB: %u\nC: %u\nD: %u\nE: %u\nP: %u\n",
           res[ANSWER_A], res[ANSWER_B], res[ANSWER_C], res[ANSWER_D], res[ANSWER_E], res[ANSWER_PING] );

  Serial.println(tmp);

  Serial.println("********END DUMP********");
}
