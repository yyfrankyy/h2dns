const RRTypes = module.exports.IntToString = {};
const RRTypesByString = module.exports.StringToInt = {};

RRTypes[1]	= "A";
RRTypes[28]	= "AAAA";
RRTypes[18]	= "AFSDB";
RRTypes[42]	= "APL";
RRTypes[257]	= "CAA";
RRTypes[60]	= "CDNSKEY";
RRTypes[59]	= "CDS";
RRTypes[37]	= "CERT";
RRTypes[5]	= "CNAME";
RRTypes[49]	= "DHCID";
RRTypes[32769]	= "DLV";
RRTypes[39]	= "DNAME";
RRTypes[48]	= "DNSKEY";
RRTypes[43]	= "DS";
RRTypes[55]	= "HIP";
RRTypes[45]	= "IPSECKEY";
RRTypes[25]	= "KEY";
RRTypes[36]	= "KX";
RRTypes[29]	= "LOC";
RRTypes[15]	= "MX";
RRTypes[35]	= "NAPTR";
RRTypes[2]	= "NS";
RRTypes[47]	= "NSEC";
RRTypes[50]	= "NSEC3";
RRTypes[51]	= "NSEC3PARAM";
RRTypes[12]	= "PTR";
RRTypes[46]	= "RRSIG";
RRTypes[17]	= "RP";
RRTypes[24]	= "SIG";
RRTypes[6]	= "SOA";
RRTypes[33]	= "SRV";
RRTypes[44]	= "SSHFP";
RRTypes[32768]	= "TA";
RRTypes[249]	= "TKEY";
RRTypes[52]	= "TLSA";
RRTypes[250]	= "TSIG";
RRTypes[16]	= "TXT";
RRTypes[256]	= "URI";

for (let i in RRTypes) {
  RRTypesByString[RRTypes[i]] = i;
}
