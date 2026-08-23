import { describe, expect, it } from "vitest";
import { parseKasSoapResponse } from "./kas/soap";

describe("kas soap parser", () => {
  it("parses empty ReturnInfo arrays", () => {
    const xml = `<?xml version="1.0"?><SOAP-ENV:Envelope xmlns:SOAP-ENV="http://schemas.xmlsoap.org/soap/envelope/" xmlns:ns2="http://xml.apache.org/xml-soap" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:SOAP-ENC="http://schemas.xmlsoap.org/soap/encoding/"><SOAP-ENV:Body><ns1:KasApiResponse><return xsi:type="ns2:Map"><item><key xsi:type="xsd:string">Response</key><value xsi:type="ns2:Map"><item><key xsi:type="xsd:string">ReturnString</key><value xsi:type="xsd:string">TRUE</value></item><item><key xsi:type="xsd:string">ReturnInfo</key><value SOAP-ENC:arrayType="xsd:ur-type[0]" xsi:type="SOAP-ENC:Array"/></item></value></item></return></ns1:KasApiResponse></SOAP-ENV:Body></SOAP-ENV:Envelope>`;

    expect(parseKasSoapResponse(xml)).toEqual([]);
  });
});
