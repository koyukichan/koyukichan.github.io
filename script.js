
//非同期処理
(async function main() {
  //必要な引数を定義
  const localVideo = document.getElementById('my-video');      //発信者側のビデオ情報
  const localId = document.getElementById('my-id');            //発信者側のPeerID
  const callTrigger = document.getElementById('make-call');    //発信ボタン
  const closeTrigger = document.getElementById('call-end');    //通話終了ボタン
  const remoteVideo = document.getElementById('their-video');  //相手側のビデオ情報
  const remoteId = document.getElementById('their-id');        //相手側のPeerID
  
  //カメラ映像取得(発信者側)
  const localStream = await navigator.mediaDevices
    .getUserMedia({
      audio: true,
      video: true,
    })
    .catch(console.error);


  //Peer作成
  const peer = new Peer({
    //作成したAPIキー
    key: 'da6be063-02ee-4a88-a3a0-620e943ca8f7',
    debug: 3
  });

  //PeerID取得
  peer.once('open', id => (localId.textContent = id));
 

  //発信ボタンを押したら開く(発信者側)
  callTrigger.addEventListener('click', () => {

    //発信ボタンを押したらページ移動　※これをすると毎回PeerIDが変わってしまうため、ビデオ通話できない
    //location = "./video.html"
      
    //相手のpeerIDに接続できなかった場合は終了する
    if (!peer.open) {
      return;
    }

    const mediaConnection = peer.call(remoteId.value, localStream);
    

    // イベントリスナを設置する関数
    mediaConnection.on('stream', async stream => {
      // 相手のビデオ映像を再生
      remoteVideo.srcObject = stream;
      remoteVideo.playsInline = true;
      await remoteVideo.play().catch(console.error);
      
      //自分のビデオ映像を再生
      localVideo.srcObject = localStream;
      localVideo.playsInline = true;
      await localVideo.play().catch(console.error);
    });

    mediaConnection.once('close', () => {
      //相手との接続が切れたら相手のビデオ映像を消す
      remoteVideo.srcObject.getTracks().forEach(track => track.stop());
      remoteVideo.srcObject = null;

      //自分のビデオ映像を消す
      localVideo.srcObject.getTracks().forEach(track => track.stop());
      localVideo.srcObject = null;
    });

    //通話終了ボタンを押したら閉じる
    closeTrigger.addEventListener('click', () =>{
       mediaConnection.close(true);

      //通話終了ボタンを押したらページ移動
      //location = "./index.html"
    });
  });

  //着信処理(相手側)
  peer.on('call', mediaConnection => {

    //発信ボタンを押したらページ移動 
    //location = "./video.html"

    mediaConnection.answer(localStream);

    mediaConnection.on('stream', async stream => {
      //相手のビデオ映像を再生
      remoteVideo.srcObject = stream;
      remoteVideo.playsInline = true;
      await remoteVideo.play().catch(console.error);

      //自分のビデオ映像を再生
      localVideo.srcObject = localStream;
      localVideo.playsInline = true;
      await localVideo.play().catch(console.error);
    });

    mediaConnection.once('close', () => {
      //相手との接続が切れたら相手のビデオ映像を消す
      remoteVideo.srcObject.getTracks().forEach(track => track.stop());
      remoteVideo.srcObject = null;

      //自分のビデオ映像を消す
      localVideo.srcObject.getTracks().forEach(track => track.stop());
      localVideo.srcObject = null;
    });

    //通話終了ボタンを押したら閉じる
    closeTrigger.addEventListener('click', () => {
      mediaConnection.close(true);
      //通話終了ボタンを押したらページ移動
      //location = "./index.html"
    });
  });

  //PeerIDを取得するときにエラーが出たらエラー表示する
  peer.on('error', console.error);

  })();
