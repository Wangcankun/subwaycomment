var list_subway = BMapSub.SubwayCitiesList;
console.log('list_subway:', list_subway);

var map = new BMap.Map("allmap",{minZoom:5,maxZoom:8, enableMapClick:false});
map.centerAndZoom(new BMap.Point(100.404, 39.915), 5);
// nav
var navControl = new BMap.NavigationControl({
  anchor: BMAP_ANCHOR_TOP_LEFT,
  type: BMAP_NAVIGATION_CONTROL_LARGE,
  enableGeolocation: true
});
map.addControl(navControl);
// geolocation
var geolocationControl = new BMap.GeolocationControl();
geolocationControl.addEventListener("locationSuccess", function (e) {
  // 定位成功事件
  var address = '';
  address += e.addressComponent.province;
  address += e.addressComponent.city;
  address += e.addressComponent.district;
  address += e.addressComponent.street;
  address += e.addressComponent.streetNumber;
  console.log("当前定位地址为：" + address);
});
geolocationControl.addEventListener("locationError", function (e) {
  alert('定位失败：', e.message);
});
map.addControl(geolocationControl);
// maptype
map.addControl(new BMap.MapTypeControl({
  mapTypes: [
    BMAP_NORMAL_MAP,
    BMAP_HYBRID_MAP
  ]}));

map.setCurrentCity('北京');
map.enableScrollWheelZoom(true);

// var point = new BMap.Point(116.4, 39.92);
// var marker= new BMap.Marker(point);
// map.addOverlay(marker);
// marker.disableDragging();

// 	// 编写自定义函数,创建标注
// function addMarker(point){
//   var marker = new BMap.Marker(point);
//   map.addOverlay(marker);
// }
// // 随机向地图添加25个标注
// var bounds = map.getBounds();
// var sw = bounds.getSouthWest();
// var ne = bounds.getNorthEast();
// var lngSpan = Math.abs(sw.lng - ne.lng);
// var latSpan = Math.abs(ne.lat - sw.lat);
// for (var i = 0; i < 25; i ++) {
//   var point = new BMap.Point(sw.lng + lngSpan * (Math.random() * 0.7), ne.lat - latSpan * (Math.random() * 0.7));
//   addMarker(point);
// }
// 多事件注册：http://lbsyun.baidu.com/jsdemo.htm#h0_5

// var myGeo = new BMap.Geocoder();
// myGeo.getPoint("北京市海淀区上地10街", function (point) {
//   if (point) {
//     // map.centerAndZoom(point, 16);
//     map.addOverlay(new BMap.Marker(point));
//   } else {
//     alert("您选择地址没有解析到结果!");
//   }
// });

var index = 0;
var myGeo = new BMap.Geocoder();
bdGEO();
function bdGEO () {
  var city_subway = list_subway[index];
  geocodeSearch(city_subway);
  index++;
}
function geocodeSearch (city) {
  console.log('city:', city);
  if (index >= list_subway.length) {
    return;
  }
  setTimeout(bdGEO, 400);
  myGeo.getPoint(city.name, function (point) {
    // console.log('city:' + city.name);
    if (point) {
      // console.log('point:', point);
      addMarker(new BMap.Point(point.lng, point.lat), city);
    } else {
      // console.error('point:', point);
    }
  });
}
function addMarker (point, city) {
  var marker = new BMap.Marker(point);
  map.addOverlay(marker);
  marker.addEventListener('click', function () {
    jump2SubwayMap(city.citycode);
  });
}
function jump2SubwayMap (code) {
  console.log('code:', code);
  location.href = 'subway.html?code=' + code;
}