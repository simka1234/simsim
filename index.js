const node_kakao = require("@storycraft/node-kakao");
const readline = require('readline');
const email = process.env.email;
const password = process.env.password;
const deviceUUID = process.env.uuid;
const deviceNAME = process.env.deviceName;
let client = new node_kakao.TalkClient(deviceNAME, deviceUUID);

async function login(email, password, deviceUUID, deviceNAME, forced) {
    await client.login(email, password, deviceUUID, forced).catch(function (error) {
        if (error.status === -100) {
            let r = readline.createInterface({
                input: process.stdin,
                output: process.stdout
            });
            console.log("디바이스가 인증이 되어있지 않습니다. 인증하시겠습니까?");
            r.question('Y/N: ', function(answer) {
                if (answer === 'Y' || answer === 'y') {
                    node_kakao.KakaoAPI.requestPasscode(email, password, deviceUUID, deviceNAME);
                    console.log("카카오톡에서 온 인증번호를 입력해주세요.");
                    r.question('인증번호: ', function(answer) {
                        let res = node_kakao.KakaoAPI.registerDevice(answer, email, password, deviceUUID, deviceNAME);
                        console.log(res);
                    });
                } else {
                    process.exit();
                }
            });
        } else {
            console.log(error);
        }
    });
}

login(email, password, deviceUUID, deviceNAME, true);
client.on('message', (chat) => {
    function sendCustomFeedSlide(chat, slide) {
        var info = new node_kakao.CustomInfo(
            "카카오링크",
            "Carousel",
            "plusfriend_bot",
            "http://magenta.kro.kr",
            "6.4.5",
            "6.4.5",
            "2.6.1",
            "2.3.5",
            undefined,
            undefined,
            undefined,
            undefined,
            false, // Link
            true, // BigChat
            false, // Sercure
            false, // KakaoVerifed (카카오 뱃지)
            true, // CanForward
            true, // Ref
            true // Ad
        )
        var content = new node_kakao.CustomCarouselContent(
            node_kakao.CustomType.FEED, slide.map(feed => {
                feed.buttons = feed.buttons || [];
                feed.images = feed.images || [];
                var buttonTypes = {
                    "up-down": 1,
                    "left-right": 0
                };
                if (feed.buttonType == "left-right") feed.buttons = feed.buttons.slice(0, 2);
                else if (feed.buttonType == "up-down") feed.buttons = feed.buttons.slice(0, 5);
                var cont = new node_kakao.CustomFeedContent(
                    new node_kakao.TextDescFragment(feed.text, feed.desc),
                    buttonTypes[feed.buttonType],
                    feed.buttons.map(s => {
                        return new node_kakao.ButtonFragment(
                            s.text,
                            "both",
                            new node_kakao.URLFragment(...new Array(4).fill(s.url))
                        );
                    }),
                    feed.images.map(s => {
                        return new node_kakao.ImageFragment(getImageURL(s.image),
                            s.width || -1, s.height || -1, s.cropStyle || 0, s.isLive || false)
                    }),
                    feed.images.length,
                    undefined, undefined, undefined, new node_kakao.ProfileFragment(
                        new node_kakao.TextDescFragment("", ""),
                        undefined,
                        undefined,
                        new node_kakao.ImageFragment("", 200, 200)
                    ),
                    new node_kakao.SocialFragment()
                );
                return cont;
            })
        );
    };
    function sendKakaoLink(chat, json) {
        var Info = new node_kakao.CustomInfo("text", "Feed", "plusfriend_bot", "http://coronabot.kro.kr", "6.4.5", "6.4.5", "2.6.1", "2.3.5", undefined, undefined, undefined, undefined, false, true, false, true, true, true, true);
        var Text =  new node_kakao.CustomFeedContent(new node_kakao.TextDescFragment(json.Text[0], json.Text[1]), 1, [new node_kakao.ButtonFragment(json.Button[0], "both", new node_kakao.URLFragment(" ", " ", json.Button[1], json.Button[1]))], [new node_kakao.ImageFragment(json.Image[0], json.Image[1], json.Image[2], 0, json.Image[3], json.Image[4])], 0, undefined, true);
        var Main = new node_kakao.CustomAttachment(Info, Text);
        chat.replyTemplate(new node_kakao.AttachmentTemplate(Main));
    }
    var userInfo = chat.Channel.getUserInfo(chat.Sender);
    if (!userInfo) return;
    if (chat.Text === '테스트') {
        chat.replyText(new node_kakao.ChatMention(userInfo), ', 테스트 성공!'); // Ex) 안녕하세요 @storycraft
    }
    if (chat.Text === '답장') {
        chat.Channel.sendTemplate(new node_kakao.AttachmentTemplate(node_kakao.ReplyAttachment.fromChat(chat), new node_kakao.ChatMention(userInfo), ', 답장성공!')); // 답장형식
    }
    if (chat.Text === '카링') {
        sendKakaoLink(chat, {
            Text: ["심심해"],
            Image: ["", 334, 250, false, 0],
            Button: ["웹사이트", "https://simsim.msub.kr/"]
        });
    }
});
client.on('user_join', (channel, user, feed) => {
    let info = channel.getUserInfo(user);
    if (!info)
        return;
    channel.sendText(info.Nickname + ' 님 안녕하세요');
});
