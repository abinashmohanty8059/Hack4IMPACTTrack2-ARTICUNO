BASE_URL = http://your-server-ip:8000

┌─────────────────────────────────────────────────────────┐
│ ENDPOINT               │ METHOD │ PURPOSE               │
├─────────────────────────────────────────────────────────┤
│ /webhook               │ GET    │ Meta verification     │
│ /webhook               │ POST   │ Inbound WA messages   │
│ /api/cases             │ GET    │ All escalated cases   │
│ /api/cases/{phone}     │ GET    │ Single case + history │
│ /api/cases/{phone}/resolve │ POST│ Mark resolved        │
│ /api/send              │ POST   │ Doctor → patient msg  │
│ /ws/cases              │ WS     │ Real-time new cases   │
│ /health                │ GET    │ Health check          │
│ /docs                  │ GET    │ Swagger UI            │
└─────────────────────────────────────────────────────────┘

FLUTTER DIO SETUP:
  final dio = Dio(BaseOptions(baseUrl: 'http://your-server:8000'));

GET CASES:
  final res = await dio.get('/api/cases');
  List cases = res.data;

GET SINGLE CASE:
  final res = await dio.get('/api/cases/$phone');
  Map case = res.data;

DOCTOR SEND MESSAGE:
  await dio.post('/api/send', data: {
    'to': phone,
    'message': doctorMessage
  });

RESOLVE CASE:
  await dio.post('/api/cases/$phone/resolve');

WEBSOCKET (riverpod):
  final channel = WebSocketChannel.connect(
    Uri.parse('ws://your-server:8000/ws/cases')
  );
  channel.stream.listen((data) {
    final event = jsonDecode(data);
    if (event['event'] == 'new_case') {
      ref.invalidate(casesProvider); // refresh list
    }
  });
