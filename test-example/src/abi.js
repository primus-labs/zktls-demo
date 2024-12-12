
export const contractData = {"abi":[{"type":"constructor","inputs":[{"name":"_primusAddress","type":"address","internalType":"address"}],"stateMutability":"nonpayable"},{"type":"function","name":"primusAddress","inputs":[],"outputs":[{"name":"","type":"address","internalType":"address"}],"stateMutability":"view"},{"type":"function","name":"verifySignature","inputs":[{"name":"attestation","type":"tuple","internalType":"struct Attestation","components":[{"name":"recipient","type":"address","internalType":"address"},{"name":"request","type":"tuple","internalType":"struct AttNetworkRequest","components":[{"name":"url","type":"string","internalType":"string"},{"name":"header","type":"string","internalType":"string"},{"name":"method","type":"string","internalType":"string"},{"name":"body","type":"string","internalType":"string"}]},{"name":"reponseResolve","type":"tuple[]","internalType":"struct AttNetworkResponseResolve[]","components":[{"name":"keyName","type":"string","internalType":"string"},{"name":"parseType","type":"string","internalType":"string"},{"name":"parsePath","type":"string","internalType":"string"}]},{"name":"data","type":"string","internalType":"string"},{"name":"attConditions","type":"string","internalType":"string"},{"name":"timestamp","type":"uint64","internalType":"uint64"},{"name":"additionParams","type":"string","internalType":"string"},{"name":"attestors","type":"tuple[]","internalType":"struct Attestor[]","components":[{"name":"attestorAddr","type":"address","internalType":"address"},{"name":"url","type":"string","internalType":"string"}]},{"name":"signatures","type":"bytes[]","internalType":"bytes[]"}]}],"outputs":[{"name":"","type":"bool","internalType":"bool"}],"stateMutability":"view"}],"bytecode":{"object":"0x608060405234801561000f575f80fd5b5060405161069438038061069483398101604081905261002e91610052565b5f80546001600160a01b0319166001600160a01b039290921691909117905561007f565b5f60208284031215610062575f80fd5b81516001600160a01b0381168114610078575f80fd5b9392505050565b6106088061008c5f395ff3fe608060405234801561000f575f80fd5b5060043610610034575f3560e01c80635ecd7b8014610038578063ce2d5e2514610060575b5f80fd5b61004b6100463660046100ed565b61008a565b60405190151581526020015b60405180910390f35b5f54610072906001600160a01b031681565b6040516001600160a01b039091168152602001610057565b5f8054604051620f8bbf60e81b81526001600160a01b0390911690630f8bbf00906100b9908590600401610472565b5f6040518083038186803b1580156100cf575f80fd5b505afa1580156100e1573d5f803e3d5ffd5b50600195945050505050565b5f602082840312156100fd575f80fd5b813567ffffffffffffffff811115610113575f80fd5b82016101208185031215610125575f80fd5b9392505050565b80356001600160a01b0381168114610142575f80fd5b919050565b5f8235607e1983360301811261015b575f80fd5b90910192915050565b5f808335601e19843603018112610179575f80fd5b830160208101925035905067ffffffffffffffff811115610198575f80fd5b8036038213156101a6575f80fd5b9250929050565b81835281816020850137505f828201602090810191909152601f909101601f19169091010190565b5f6101e08283610164565b608085526101f26080860182846101ad565b9150506102026020840184610164565b85830360208701526102158382846101ad565b925050506102266040840184610164565b85830360408701526102398382846101ad565b9250505061024a6060840184610164565b858303606087015261025d8382846101ad565b9695505050505050565b5f808335601e1984360301811261027c575f80fd5b830160208101925035905067ffffffffffffffff81111561029b575f80fd5b8060051b36038213156101a6575f80fd5b8183525f60208085019450848460051b8601845f805b8881101561035e578484038a528235605e198936030181126102e2578283fd5b880160606102f08280610164565b82885261030083890182846101ad565b9250505061031088830183610164565b8783038a8901526103228382846101ad565b92505050604061033481840184610164565b9350878303828901526103488385836101ad565b9d8a019d975050509387019350506001016102c2565b509198975050505050505050565b803567ffffffffffffffff81168114610142575f80fd5b8183525f6020808501808196508560051b81019150845f805b88811015610409578385038a528235603e198936030181126103bc578283fd5b880160406001600160a01b036103d18361012c565b1687526103e088830183610164565b925081898901526103f482890184836101ad565b9c89019c97505050928601925060010161039c565b509298975050505050505050565b8183525f6020808501808196508560051b81019150845f5b878110156104655782840389526104468288610164565b6104518682846101ad565b9a87019a955050509084019060010161042f565b5091979650505050505050565b60208152610493602082016104868461012c565b6001600160a01b03169052565b5f6104a16020840184610147565b6101208060408501526104b86101408501836101d5565b91506104c76040860186610267565b601f19808786030160608801526104df8583856102ac565b94506104ee6060890189610164565b93509150808786030160808801526105078584846101ad565b94506105166080890189610164565b93509150808786030160a088015261052f8584846101ad565b945061053d60a0890161036c565b67ffffffffffffffff811660c0890152925061055c60c0890189610164565b93509150808786030160e08801526105758584846101ad565b945061058460e0890189610267565b9350915061010081888703018189015261059f868585610383565b95506105ad818a018a610267565b9450925050808786030184880152506105c7848383610417565b97965050505050505056fea26469706673582212203e7be32d15c81e182e93adf54c060db6f278279ca243c639259a844c115502a464736f6c63430008140033","sourceMap":"152:524:21:-:0;;;213:135;;;;;;;;;;;;;;;;;;;;;;;;;;;;:::i;:::-;312:13;:30;;-1:-1:-1;;;;;;312:30:21;-1:-1:-1;;;;;312:30:21;;;;;;;;;;152:524;;14:290:22;84:6;137:2;125:9;116:7;112:23;108:32;105:52;;;153:1;150;143:12;105:52;179:16;;-1:-1:-1;;;;;224:31:22;;214:42;;204:70;;270:1;267;260:12;204:70;293:5;14:290;-1:-1:-1;;;14:290:22:o;:::-;152:524:21;;;;;;","linkReferences":{}},"deployedBytecode":{"object":"0x608060405234801561000f575f80fd5b5060043610610034575f3560e01c80635ecd7b8014610038578063ce2d5e2514610060575b5f80fd5b61004b6100463660046100ed565b61008a565b60405190151581526020015b60405180910390f35b5f54610072906001600160a01b031681565b6040516001600160a01b039091168152602001610057565b5f8054604051620f8bbf60e81b81526001600160a01b0390911690630f8bbf00906100b9908590600401610472565b5f6040518083038186803b1580156100cf575f80fd5b505afa1580156100e1573d5f803e3d5ffd5b50600195945050505050565b5f602082840312156100fd575f80fd5b813567ffffffffffffffff811115610113575f80fd5b82016101208185031215610125575f80fd5b9392505050565b80356001600160a01b0381168114610142575f80fd5b919050565b5f8235607e1983360301811261015b575f80fd5b90910192915050565b5f808335601e19843603018112610179575f80fd5b830160208101925035905067ffffffffffffffff811115610198575f80fd5b8036038213156101a6575f80fd5b9250929050565b81835281816020850137505f828201602090810191909152601f909101601f19169091010190565b5f6101e08283610164565b608085526101f26080860182846101ad565b9150506102026020840184610164565b85830360208701526102158382846101ad565b925050506102266040840184610164565b85830360408701526102398382846101ad565b9250505061024a6060840184610164565b858303606087015261025d8382846101ad565b9695505050505050565b5f808335601e1984360301811261027c575f80fd5b830160208101925035905067ffffffffffffffff81111561029b575f80fd5b8060051b36038213156101a6575f80fd5b8183525f60208085019450848460051b8601845f805b8881101561035e578484038a528235605e198936030181126102e2578283fd5b880160606102f08280610164565b82885261030083890182846101ad565b9250505061031088830183610164565b8783038a8901526103228382846101ad565b92505050604061033481840184610164565b9350878303828901526103488385836101ad565b9d8a019d975050509387019350506001016102c2565b509198975050505050505050565b803567ffffffffffffffff81168114610142575f80fd5b8183525f6020808501808196508560051b81019150845f805b88811015610409578385038a528235603e198936030181126103bc578283fd5b880160406001600160a01b036103d18361012c565b1687526103e088830183610164565b925081898901526103f482890184836101ad565b9c89019c97505050928601925060010161039c565b509298975050505050505050565b8183525f6020808501808196508560051b81019150845f5b878110156104655782840389526104468288610164565b6104518682846101ad565b9a87019a955050509084019060010161042f565b5091979650505050505050565b60208152610493602082016104868461012c565b6001600160a01b03169052565b5f6104a16020840184610147565b6101208060408501526104b86101408501836101d5565b91506104c76040860186610267565b601f19808786030160608801526104df8583856102ac565b94506104ee6060890189610164565b93509150808786030160808801526105078584846101ad565b94506105166080890189610164565b93509150808786030160a088015261052f8584846101ad565b945061053d60a0890161036c565b67ffffffffffffffff811660c0890152925061055c60c0890189610164565b93509150808786030160e08801526105758584846101ad565b945061058460e0890189610267565b9350915061010081888703018189015261059f868585610383565b95506105ad818a018a610267565b9450925050808786030184880152506105c7848383610417565b97965050505050505056fea26469706673582212203e7be32d15c81e182e93adf54c060db6f278279ca243c639259a844c115502a464736f6c63430008140033","sourceMap":"152:524:21:-:0;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;353:321;;;;;;:::i;:::-;;:::i;:::-;;;576:14:22;;569:22;551:41;;539:2;524:18;353:321:21;;;;;;;;179:28;;;;;-1:-1:-1;;;;;179:28:21;;;;;;-1:-1:-1;;;;;876:32:22;;;858:51;;846:2;831:18;179:28:21;712:203:22;353:321:21;432:4;461:13;;448:58;;-1:-1:-1;;;448:58:21;;-1:-1:-1;;;;;461:13:21;;;;448:45;;:58;;494:11;;448:58;;;:::i;:::-;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;-1:-1:-1;664:4:21;;353:321;-1:-1:-1;;;;;353:321:21:o;14:392:22:-;105:6;158:2;146:9;137:7;133:23;129:32;126:52;;;174:1;171;164:12;126:52;214:9;201:23;247:18;239:6;236:30;233:50;;;279:1;276;269:12;233:50;302:22;;358:3;340:16;;;336:26;333:46;;;375:1;372;365:12;333:46;398:2;14:392;-1:-1:-1;;;14:392:22:o;920:173::-;988:20;;-1:-1:-1;;;;;1037:31:22;;1027:42;;1017:70;;1083:1;1080;1073:12;1017:70;920:173;;;:::o;1098:303::-;1175:5;1234:3;1221:17;1320:3;1316:8;1305;1289:14;1285:29;1281:44;1261:18;1257:69;1247:97;;1340:1;1337;1330:12;1247:97;1362:33;;;;1098:303;-1:-1:-1;;1098:303:22:o;1406:501::-;1465:5;1472:6;1532:3;1519:17;1618:2;1614:7;1603:8;1587:14;1583:29;1579:43;1559:18;1555:68;1545:96;;1637:1;1634;1627:12;1545:96;1665:33;;1769:4;1756:18;;;-1:-1:-1;1717:21:22;;-1:-1:-1;1797:18:22;1786:30;;1783:50;;;1829:1;1826;1819:12;1783:50;1876:6;1860:14;1856:27;1849:5;1845:39;1842:59;;;1897:1;1894;1887:12;1842:59;1406:501;;;;;:::o;1912:267::-;2001:6;1996:3;1989:19;2053:6;2046:5;2039:4;2034:3;2030:14;2017:43;-1:-1:-1;2105:1:22;2080:16;;;2098:4;2076:27;;;2069:38;;;;2161:2;2140:15;;;-1:-1:-1;;2136:29:22;2127:39;;;2123:50;;1912:267::o;2184:1001::-;2253:3;2305:45;2344:5;2337;2305:45;:::i;:::-;2371:4;2366:3;2359:17;2397:70;2461:4;2456:3;2452:14;2438:12;2424;2397:70;:::i;:::-;2385:82;;;2514:56;2564:4;2557:5;2553:16;2546:5;2514:56;:::i;:::-;2612:3;2606:4;2602:14;2595:4;2590:3;2586:14;2579:38;2640:64;2699:4;2683:14;2667;2640:64;:::i;:::-;2626:78;;;;2751:56;2801:4;2794:5;2790:16;2783:5;2751:56;:::i;:::-;2851:3;2843:6;2839:16;2832:4;2827:3;2823:14;2816:40;2879:66;2938:6;2922:14;2906;2879:66;:::i;:::-;2865:80;;;;2992:56;3042:4;3035:5;3031:16;3024:5;2992:56;:::i;:::-;3092:3;3084:6;3080:16;3073:4;3068:3;3064:14;3057:40;3113:66;3172:6;3156:14;3140;3113:66;:::i;:::-;3106:73;2184:1001;-1:-1:-1;;;;;;2184:1001:22:o;3190:554::-;3294:5;3301:6;3361:3;3348:17;3447:2;3443:7;3432:8;3416:14;3412:29;3408:43;3388:18;3384:68;3374:96;;3466:1;3463;3456:12;3374:96;3494:33;;3598:4;3585:18;;;-1:-1:-1;3546:21:22;;-1:-1:-1;3626:18:22;3615:30;;3612:50;;;3658:1;3655;3648:12;3612:50;3712:6;3709:1;3705:14;3689;3685:35;3678:5;3674:47;3671:67;;;3734:1;3731;3724:12;3749:1545;3883:6;3878:3;3871:19;3853:3;3909:4;3938:2;3933:3;3929:12;3922:19;;3963:3;4003:6;4000:1;3996:14;3991:3;3987:24;4034:5;4057:1;4078;4088:1180;4104:6;4099:3;4096:15;4088:1180;;;4179:5;4173:4;4169:16;4164:3;4157:29;4238:6;4225:20;4328:2;4324:7;4316:5;4300:14;4296:26;4292:40;4272:18;4268:65;4258:93;;4347:1;4344;4337:12;4258:93;4379:30;;4432:4;4483:49;4379:30;;4483:49;:::i;:::-;4558:2;4552:4;4545:16;4588:69;4653:2;4647:4;4643:13;4629:12;4615;4588:69;:::i;:::-;4574:83;;;;4708:58;4762:2;4753:7;4749:16;4740:7;4708:58;:::i;:::-;4813:4;4805:6;4801:17;4796:2;4790:4;4786:13;4779:40;4846:66;4905:6;4889:14;4873;4846:66;:::i;:::-;4832:80;;;;4935:4;4990:58;5044:2;5035:7;5031:16;5022:7;4990:58;:::i;:::-;4952:96;;5095:4;5087:6;5083:17;5078:2;5072:4;5068:13;5061:40;5122:66;5181:6;5165:14;5149;5122:66;:::i;:::-;5246:12;;;;5114:74;-1:-1:-1;;;5211:15:22;;;;-1:-1:-1;;4130:1:22;4121:11;4088:1180;;;-1:-1:-1;5284:4:22;;3749:1545;-1:-1:-1;;;;;;;;3749:1545:22:o;5299:171::-;5366:20;;5426:18;5415:30;;5405:41;;5395:69;;5460:1;5457;5450:12;5582:1138;5699:6;5694:3;5687:19;5669:3;5725:4;5766:2;5761:3;5757:12;5791:11;5818;5811:18;;5868:6;5865:1;5861:14;5854:5;5850:26;5838:38;;5899:5;5922:1;5943;5953:741;5969:6;5964:3;5961:15;5953:741;;;6044:5;6038:4;6034:16;6029:3;6022:29;6103:6;6090:20;6193:2;6189:7;6181:5;6165:14;6161:26;6157:40;6137:18;6133:65;6123:93;;6212:1;6209;6202:12;6123:93;6244:30;;6297:4;-1:-1:-1;;;;;6331:27:22;6244:30;6331:27;:::i;:::-;6327:53;6321:4;6314:67;6428:58;6482:2;6473:7;6469:16;6460:7;6428:58;:::i;:::-;6394:92;;6521:2;6516;6510:4;6506:13;6499:25;6545:69;6610:2;6604:4;6600:13;6586:12;6572;6545:69;:::i;:::-;6672:12;;;;6537:77;-1:-1:-1;;;6637:15:22;;;;-1:-1:-1;5995:1:22;5986:11;5953:741;;;-1:-1:-1;6710:4:22;;5582:1138;-1:-1:-1;;;;;;;;5582:1138:22:o;6725:716::-;6832:6;6827:3;6820:19;6802:3;6858:4;6899:2;6894:3;6890:12;6924:11;6951;6944:18;;7001:6;6998:1;6994:14;6987:5;6983:26;6971:38;;7032:5;7055:1;7065:350;7079:6;7076:1;7073:13;7065:350;;;7150:5;7144:4;7140:16;7135:3;7128:29;7206:46;7245:6;7238:5;7206:46;:::i;:::-;7273:62;7330:4;7315:13;7300;7273:62;:::i;:::-;7393:12;;;;7265:70;-1:-1:-1;;;7358:15:22;;;;7101:1;7094:9;7065:350;;;-1:-1:-1;7431:4:22;;6725:716;-1:-1:-1;;;;;;;6725:716:22:o;7446:2503::-;7637:2;7626:9;7619:21;7649:66;7711:2;7700:9;7696:18;7668:26;7687:6;7668:26;:::i;:::-;-1:-1:-1;;;;;669:31:22;657:44;;603:104;7649:66;7600:4;7744:74;7814:2;7806:6;7802:15;7794:6;7744:74;:::i;:::-;7837:6;7879:2;7874;7863:9;7859:18;7852:30;7905:79;7979:3;7968:9;7964:19;7950:12;7905:79;:::i;:::-;7891:93;;8029:101;8126:2;8118:6;8114:15;8106:6;8029:101;:::i;:::-;8153:2;8149:7;8220:2;8208:9;8200:6;8196:22;8192:31;8187:2;8176:9;8172:18;8165:59;8247:109;8349:6;8335:12;8319:14;8247:109;:::i;:::-;8233:123;;8403:56;8455:2;8447:6;8443:15;8435:6;8403:56;:::i;:::-;8365:94;;;;8524:2;8512:9;8504:6;8500:22;8496:31;8490:3;8479:9;8475:19;8468:60;8551:66;8610:6;8594:14;8578;8551:66;:::i;:::-;8537:80;;8664:57;8716:3;8708:6;8704:16;8696:6;8664:57;:::i;:::-;8626:95;;;;8786:2;8774:9;8766:6;8762:22;8758:31;8752:3;8741:9;8737:19;8730:60;8813:66;8872:6;8856:14;8840;8813:66;:::i;:::-;8799:80;;8910:35;8940:3;8932:6;8928:16;8910:35;:::i;:::-;5551:18;5540:30;;9003:3;8988:19;;5528:43;8888:57;-1:-1:-1;9055:57:22;9107:3;9099:6;9095:16;9087:6;9055:57;:::i;:::-;9017:95;;;;9177:2;9165:9;9157:6;9153:22;9149:31;9143:3;9132:9;9128:19;9121:60;9204:66;9263:6;9247:14;9231;9204:66;:::i;:::-;9190:80;;9317:102;9414:3;9406:6;9402:16;9394:6;9317:102;:::i;:::-;9279:140;;;;9438:3;9505:2;9493:9;9485:6;9481:22;9477:31;9472:2;9461:9;9457:18;9450:59;9532:94;9619:6;9603:14;9587;9532:94;:::i;:::-;9518:108;;9673:101;9770:2;9762:6;9758:15;9750:6;9673:101;:::i;:::-;9635:139;;;;;9838:2;9826:9;9818:6;9814:22;9810:31;9805:2;9794:9;9790:18;9783:59;;9859:84;9936:6;9920:14;9904;9859:84;:::i;:::-;9851:92;7446:2503;-1:-1:-1;;;;;;;7446:2503:22:o","linkReferences":{}},"methodIdentifiers":{"primusAddress()":"ce2d5e25","verifySignature((address,(string,string,string,string),(string,string,string)[],string,string,uint64,string,(address,string)[],bytes[]))":"5ecd7b80"},"rawMetadata":"{\"compiler\":{\"version\":\"0.8.20+commit.a1b79de6\"},\"language\":\"Solidity\",\"output\":{\"abi\":[{\"inputs\":[{\"internalType\":\"address\",\"name\":\"_primusAddress\",\"type\":\"address\"}],\"stateMutability\":\"nonpayable\",\"type\":\"constructor\"},{\"inputs\":[],\"name\":\"primusAddress\",\"outputs\":[{\"internalType\":\"address\",\"name\":\"\",\"type\":\"address\"}],\"stateMutability\":\"view\",\"type\":\"function\"},{\"inputs\":[{\"components\":[{\"internalType\":\"address\",\"name\":\"recipient\",\"type\":\"address\"},{\"components\":[{\"internalType\":\"string\",\"name\":\"url\",\"type\":\"string\"},{\"internalType\":\"string\",\"name\":\"header\",\"type\":\"string\"},{\"internalType\":\"string\",\"name\":\"method\",\"type\":\"string\"},{\"internalType\":\"string\",\"name\":\"body\",\"type\":\"string\"}],\"internalType\":\"struct AttNetworkRequest\",\"name\":\"request\",\"type\":\"tuple\"},{\"components\":[{\"internalType\":\"string\",\"name\":\"keyName\",\"type\":\"string\"},{\"internalType\":\"string\",\"name\":\"parseType\",\"type\":\"string\"},{\"internalType\":\"string\",\"name\":\"parsePath\",\"type\":\"string\"}],\"internalType\":\"struct AttNetworkResponseResolve[]\",\"name\":\"reponseResolve\",\"type\":\"tuple[]\"},{\"internalType\":\"string\",\"name\":\"data\",\"type\":\"string\"},{\"internalType\":\"string\",\"name\":\"attConditions\",\"type\":\"string\"},{\"internalType\":\"uint64\",\"name\":\"timestamp\",\"type\":\"uint64\"},{\"internalType\":\"string\",\"name\":\"additionParams\",\"type\":\"string\"},{\"components\":[{\"internalType\":\"address\",\"name\":\"attestorAddr\",\"type\":\"address\"},{\"internalType\":\"string\",\"name\":\"url\",\"type\":\"string\"}],\"internalType\":\"struct Attestor[]\",\"name\":\"attestors\",\"type\":\"tuple[]\"},{\"internalType\":\"bytes[]\",\"name\":\"signatures\",\"type\":\"bytes[]\"}],\"internalType\":\"struct Attestation\",\"name\":\"attestation\",\"type\":\"tuple\"}],\"name\":\"verifySignature\",\"outputs\":[{\"internalType\":\"bool\",\"name\":\"\",\"type\":\"bool\"}],\"stateMutability\":\"view\",\"type\":\"function\"}],\"devdoc\":{\"kind\":\"dev\",\"methods\":{},\"version\":1},\"userdoc\":{\"kind\":\"user\",\"methods\":{},\"version\":1}},\"settings\":{\"compilationTarget\":{\"src/onchain.sol\":\"AttestorTest\"},\"evmVersion\":\"shanghai\",\"libraries\":{},\"metadata\":{\"bytecodeHash\":\"ipfs\"},\"optimizer\":{\"enabled\":true,\"runs\":200},\"remappings\":[\":@openzeppelin/contracts-upgradeable/=lib/zktls-contracts/lib/openzeppelin-contracts-upgradeable/contracts/\",\":@openzeppelin/contracts/=lib/zktls-contracts/lib/openzeppelin-contracts/contracts/\",\":@primuslabs/zktls-contracts/=lib/zktls-contracts/\",\":ds-test/=lib/zktls-contracts/lib/openzeppelin-contracts/lib/forge-std/lib/ds-test/src/\",\":erc4626-tests/=lib/zktls-contracts/lib/openzeppelin-contracts-upgradeable/lib/erc4626-tests/\",\":forge-std/=lib/forge-std/src/\",\":halmos-cheatcodes/=lib/zktls-contracts/lib/openzeppelin-contracts-upgradeable/lib/halmos-cheatcodes/src/\",\":openzeppelin-contracts-upgradeable/=lib/zktls-contracts/lib/openzeppelin-contracts-upgradeable/\",\":openzeppelin-contracts/=lib/zktls-contracts/lib/openzeppelin-contracts/\",\":zktls-contracts/=lib/zktls-contracts/\"]},\"sources\":{\"lib/zktls-contracts/src/IPrimusZKTLS.sol\":{\"keccak256\":\"0xb1b12fb1a609d3ff4227cc2c9f341f7bcd531e1af219e341b65d54be123751c8\",\"license\":\"MIT\",\"urls\":[\"bzz-raw://1eda1e255abf6f641e481eff2e01a0488d894e8ef580ddd6d80b690b7b4fbe28\",\"dweb:/ipfs/QmdL2ePeKLdSRegnPzXUdUbHmZbwvXTfEWyCMGbd6RToki\"]},\"src/onchain.sol\":{\"keccak256\":\"0xd03ec505b7b0a4ea7fead41ee9a1bae2a2e727c19b82d93fd3ecc1f4d2091b8a\",\"license\":\"MIT\",\"urls\":[\"bzz-raw://054e83290a94e9c915c087a92307d4af4b788801aa1f1ad830bad608ea230220\",\"dweb:/ipfs/QmU63Ufk8MKQXwnESgtZnFCHEzbSdYs9Rx7K7KB5zimSgd\"]}},\"version\":1}","metadata":{"compiler":{"version":"0.8.20+commit.a1b79de6"},"language":"Solidity","output":{"abi":[{"inputs":[{"internalType":"address","name":"_primusAddress","type":"address"}],"stateMutability":"nonpayable","type":"constructor"},{"inputs":[],"stateMutability":"view","type":"function","name":"primusAddress","outputs":[{"internalType":"address","name":"","type":"address"}]},{"inputs":[{"internalType":"struct Attestation","name":"attestation","type":"tuple","components":[{"internalType":"address","name":"recipient","type":"address"},{"internalType":"struct AttNetworkRequest","name":"request","type":"tuple","components":[{"internalType":"string","name":"url","type":"string"},{"internalType":"string","name":"header","type":"string"},{"internalType":"string","name":"method","type":"string"},{"internalType":"string","name":"body","type":"string"}]},{"internalType":"struct AttNetworkResponseResolve[]","name":"reponseResolve","type":"tuple[]","components":[{"internalType":"string","name":"keyName","type":"string"},{"internalType":"string","name":"parseType","type":"string"},{"internalType":"string","name":"parsePath","type":"string"}]},{"internalType":"string","name":"data","type":"string"},{"internalType":"string","name":"attConditions","type":"string"},{"internalType":"uint64","name":"timestamp","type":"uint64"},{"internalType":"string","name":"additionParams","type":"string"},{"internalType":"struct Attestor[]","name":"attestors","type":"tuple[]","components":[{"internalType":"address","name":"attestorAddr","type":"address"},{"internalType":"string","name":"url","type":"string"}]},{"internalType":"bytes[]","name":"signatures","type":"bytes[]"}]}],"stateMutability":"view","type":"function","name":"verifySignature","outputs":[{"internalType":"bool","name":"","type":"bool"}]}],"devdoc":{"kind":"dev","methods":{},"version":1},"userdoc":{"kind":"user","methods":{},"version":1}},"settings":{"remappings":["@openzeppelin/contracts-upgradeable/=lib/zktls-contracts/lib/openzeppelin-contracts-upgradeable/contracts/","@openzeppelin/contracts/=lib/zktls-contracts/lib/openzeppelin-contracts/contracts/","@primuslabs/zktls-contracts/=lib/zktls-contracts/","ds-test/=lib/zktls-contracts/lib/openzeppelin-contracts/lib/forge-std/lib/ds-test/src/","erc4626-tests/=lib/zktls-contracts/lib/openzeppelin-contracts-upgradeable/lib/erc4626-tests/","forge-std/=lib/forge-std/src/","halmos-cheatcodes/=lib/zktls-contracts/lib/openzeppelin-contracts-upgradeable/lib/halmos-cheatcodes/src/","openzeppelin-contracts-upgradeable/=lib/zktls-contracts/lib/openzeppelin-contracts-upgradeable/","openzeppelin-contracts/=lib/zktls-contracts/lib/openzeppelin-contracts/","zktls-contracts/=lib/zktls-contracts/"],"optimizer":{"enabled":true,"runs":200},"metadata":{"bytecodeHash":"ipfs"},"compilationTarget":{"src/onchain.sol":"AttestorTest"},"evmVersion":"shanghai","libraries":{}},"sources":{"lib/zktls-contracts/src/IPrimusZKTLS.sol":{"keccak256":"0xb1b12fb1a609d3ff4227cc2c9f341f7bcd531e1af219e341b65d54be123751c8","urls":["bzz-raw://1eda1e255abf6f641e481eff2e01a0488d894e8ef580ddd6d80b690b7b4fbe28","dweb:/ipfs/QmdL2ePeKLdSRegnPzXUdUbHmZbwvXTfEWyCMGbd6RToki"],"license":"MIT"},"src/onchain.sol":{"keccak256":"0xd03ec505b7b0a4ea7fead41ee9a1bae2a2e727c19b82d93fd3ecc1f4d2091b8a","urls":["bzz-raw://054e83290a94e9c915c087a92307d4af4b788801aa1f1ad830bad608ea230220","dweb:/ipfs/QmU63Ufk8MKQXwnESgtZnFCHEzbSdYs9Rx7K7KB5zimSgd"],"license":"MIT"}},"version":1},"id":21}