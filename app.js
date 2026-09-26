const $ =
  id =>
    document.getElementById(id);


let allBridge = [];

let bridge = [];

let opportunities = [];

let executive = {};

let reportConfig = {};

let charts = {};


/* ==============================================
   FORMAT
============================================== */

const N =
  value =>
    Number(value) || 0;


const money =
  value => {

    const n =
      N(value);

    const abs =
      Math.abs(n);


    if (abs >= 1e9) {

      return (
        new Intl.NumberFormat(
          'vi-VN',
          {
            maximumFractionDigits: 1
          }
        ).format(
          n / 1e9
        ) +
        ' Tỷ đ'
      );
    }


    if (abs >= 1e6) {

      return (
        new Intl.NumberFormat(
          'vi-VN',
          {
            maximumFractionDigits: 1
          }
        ).format(
          n / 1e6
        ) +
        ' Tr đ'
      );
    }


    return (
      new Intl.NumberFormat(
        'vi-VN'
      ).format(n) +
      ' đ'
    );
  };


const percent =
  value => {

    if (
      value === null ||
      value === undefined
    ) {
      return '—';
    }

    return (
      (
        N(value) *
        100
      ).toFixed(1) +
      '%'
    );
  };


/* ==============================================
   API
============================================== */

async function api(
  dataset,
  useFilters = true
) {

  const params =
    new URLSearchParams();


  params.set(
    'dataset',
    dataset
  );


  if (useFilters) {

    const filters =
      getFilters();


    Object.entries(
      filters
    ).forEach(
      ([key, value]) => {

        if (value) {

          params.set(
            key,
            value
          );
        }
      }
    );
  }


  /*
   * tránh browser cache JSON cũ
   */

  params.set(
    '_',
    Date.now()
  );


  const separator =
    APP_CONFIG.API_URL.includes('?')
      ? '&'
      : '?';


  const url =
    APP_CONFIG.API_URL +
    separator +
    params.toString();


  const response =
    await fetch(url);


  if (!response.ok) {

    throw new Error(
      'HTTP ' +
      response.status
    );
  }


  const json =
    await response.json();


  if (!json.success) {

    throw new Error(
      json.error?.message ||
      'API trả về lỗi'
    );
  }


  return json;
}


/* ==============================================
   INITIAL LOAD
============================================== */

async function load() {

  try {

    setStatus(
      'Đang tải dữ liệu...',
      false
    );


    /*
     * Lần đầu tải ALL không filter
     * để lấy danh mục filter.
     */

    const initial =
      await api(
        'all',
        false
      );


    allBridge =
      initial.data?.bridge ||
      [];


    reportConfig =
      initial.data?.config ||
      {};


    buildFilters();


    /*
     * mặc định năm báo cáo
     */

    if (
      reportConfig.reportYear &&
      $('year')
    ) {

      $('year').value =
        String(
          reportConfig.reportYear
        );
    }


    await refreshDashboard();


  } catch (error) {

    console.error(error);

    setStatus(
      'Lỗi kết nối API: ' +
      error.message,
      false
    );
  }
}


/* ==============================================
   REFRESH WITH FILTER
============================================== */

async function refreshDashboard() {

  try {

    setStatus(
      'Đang cập nhật...',
      false
    );


    const json =
      await api(
        'all',
        true
      );


    bridge =
      json.data?.bridge ||
      [];


    opportunities =
      json.data?.opportunities ||
      [];


    executive =
      json.data?.executive ||
      {};


    reportConfig =
      json.data?.config ||
      reportConfig;


    render();


    const updated =
      json.meta?.updatedAt
        ? new Date(
            json.meta.updatedAt
          )
        : new Date();


    setStatus(
      'LIVE • API v' +
      (
        json.meta?.version ||
        ''
      ) +
      ' • Cập nhật: ' +
      updated.toLocaleString(
        'vi-VN'
      ),
      true
    );


  } catch (error) {

    console.error(error);

    setStatus(
      'Lỗi cập nhật: ' +
      error.message,
      false
    );
  }
}


/* ==============================================
   FILTERS
============================================== */

function getFilters() {

  return {

    year:
      $('year')?.value || '',

    quarter:
      $('quarter')?.value || '',

    month:
      $('month')?.value || '',

    spdv:
      $('spdv')?.value || '',

    area:
      $('area')?.value || '',

    unit:
      $('unit')?.value || ''
  };
}


function buildFilters() {

  createOptions(
    'year',
    'Năm'
  );

  createOptions(
    'month',
    'Tháng',
    true
  );

  createOptions(
    'spdv',
    'SPDV'
  );

  createOptions(
    'area',
    'Địa bàn'
  );

  createOptions(
    'unit',
    'Đơn vị'
  );
}


function createOptions(
  id,
  field,
  monthLabel = false
) {

  const element =
    $(id);


  if (!element) {
    return;
  }


  const first =
    element.options[0]
      ?.outerHTML ||
    '<option value="">Tất cả</option>';


  element.innerHTML =
    first;


  const values =
    [
      ...new Set(

        allBridge
          .map(
            row =>
              row[field]
          )
          .filter(
            value =>
              value !== '' &&
              value !== null &&
              value !== undefined
          )
      )
    ];


  values.sort(
    (a, b) => {

      if (
        !isNaN(a) &&
        !isNaN(b)
      ) {

        return (
          Number(a) -
          Number(b)
        );
      }


      return String(a)
        .localeCompare(
          String(b),
          'vi'
        );
    }
  );


  values.forEach(
    value => {

      element.add(

        new Option(

          monthLabel
            ? 'Tháng ' +
              value
            : value,

          value
        )
      );
    }
  );
}


/* ==============================================
   MAIN RENDER
============================================== */

function render() {

  renderContext();

  renderExecutive();

  renderManagementBrief();

  renderTrend();

  renderCoverage();

  renderStages();

  renderOwners();

  renderRiskTable();

  renderOpportunityTable();
}


/* ==============================================
   CONTEXT
============================================== */

function renderContext() {

  const f =
    getFilters();


  const parts = [];


  if (f.year) {
    parts.push(
      'Năm ' +
      f.year
    );
  }


  if (f.quarter) {
    parts.push(
      f.quarter
    );
  }


  if (f.month) {
    parts.push(
      'Tháng ' +
      f.month
    );
  }


  if (f.spdv) {
    parts.push(
      f.spdv
    );
  }


  if (f.area) {
    parts.push(
      f.area
    );
  }


  if (f.unit) {
    parts.push(
      f.unit
    );
  }


  $('reportContext')
    .innerHTML =

    '<b>Kỳ báo cáo:</b> ' +

    (
      parts.length
        ? parts.join(' • ')
        : 'Toàn bộ dữ liệu'
    ) +

    (
      reportConfig.asOfMonth
        ? ' &nbsp; | &nbsp; <b>As of:</b> Tháng ' +
          reportConfig.asOfMonth
        : ''
    );
}


/* ==============================================
   EXECUTIVE KPI
============================================== */

function renderExecutive() {

  const e =
    executive;


  $('planYTD').textContent =
    money(
      e.planYTD
    );


  $('actualYTD').textContent =
    money(
      e.actualYTD
    );


  $('achievementYTD')
    .textContent =
      percent(
        e.achievementYTD
      );


  $('yoyYTD')
    .textContent =
      percent(
        e.yoyYTD
      );


  $('plan').textContent =
    money(
      e.plan
    );


  $('forecast').textContent =
    money(
      e.forecast
    );


  $('forecastRate')
    .textContent =
      percent(
        e.forecastRate
      ) +
      ' KH';


  $('forecastGap')
    .textContent =
      signedMoney(
        e.forecastGap
      );


  $('shortfall')
    .textContent =
      money(
        e.shortfall
      );


  $('pipeline')
    .textContent =
      money(
        e.pipeline
      );


  $('weightedPipeline')
    .textContent =
      money(
        e.weightedPipeline
      );


  $('coverage')
    .textContent =

      e.coverage === null ||
      e.shortfall === 0

        ? 'Đã đạt KH'

        : N(
            e.coverage
          ).toFixed(1) +
          'x';


  $('pipelineBalance')
    .textContent =
      signedMoney(
        e.pipelineBalance
      );


  setValueClass(
    'achievementYTD',
    N(
      e.achievementYTD
    ) >= 1
  );


  setValueClass(
    'forecastGap',
    N(
      e.forecastGap
    ) >= 0
  );


  setValueClass(
    'pipelineBalance',
    N(
      e.pipelineBalance
    ) >= 0
  );
}


function signedMoney(
  value
) {

  const n =
    N(value);

  return (
    n > 0
      ? '+'
      : ''
  ) +
  money(n);
}


function setValueClass(
  id,
  positive
) {

  const element =
    $(id);


  if (!element) {
    return;
  }


  element.className =
    positive
      ? 'green'
      : 'red';
}


/* ==============================================
   MANAGEMENT BRIEF
============================================== */

function renderManagementBrief() {

  const e =
    executive;


  const messages = [];


  messages.push(

    `Thực hiện YTD đạt <b>${
      percent(
        e.achievementYTD
      )
    }</b> kế hoạch YTD.`
  );


  if (
    e.yoyYTD !== null &&
    e.yoyYTD !== undefined
  ) {

    messages.push(

      `So với cùng kỳ, doanh thu ${
        N(e.yoyYTD) >= 0
          ? 'tăng'
          : 'giảm'
      } <b>${
        percent(
          Math.abs(
            N(e.yoyYTD)
          )
        )
      }</b>.`
    );
  }


  if (
    N(
      e.shortfall
    ) === 0
  ) {

    messages.push(

      `Forecast hiện <b>đạt hoặc vượt kế hoạch</b>; không có Gap cần Pipeline bù.`
    );

  } else {

    messages.push(

      `Forecast còn thiếu <b>${
        money(
          e.shortfall
        )
      }</b> so với kế hoạch.`
    );


    messages.push(

      `Weighted Pipeline bao phủ <b>${
        N(
          e.coverage
        ).toFixed(1)
      }x</b> phần thiếu.`
    );


    if (
      N(
        e.pipelineBalance
      ) < 0
    ) {

      messages.push(

        `Sau khi đối chiếu Gap, Weighted Pipeline vẫn thiếu <b>${
          money(
            Math.abs(
              N(
                e.pipelineBalance
              )
            )
          )
        }</b>.`
      );

    } else {

      messages.push(

        `Weighted Pipeline đang cao hơn phần thiếu <b>${
          money(
            e.pipelineBalance
          )
        }</b>.`
      );
    }
  }


  messages.push(

    `Có <b>${
      N(
        e.staleOpportunityCount
      )
    }</b> CHKD đứng yên ≥2 tuần trên tổng <b>${
      N(
        e.opportunityCount
      )
    }</b> CHKD trong phạm vi pipeline.`
  );


  messages.push(

    `Có <b>${
      N(
        e.redAlertCount
      )
    }</b> lát cắt đang ở mức cảnh báo Đỏ.`
  );


  $('managementBrief')
    .innerHTML =

    messages
      .map(
        message =>
          `<li>${message}</li>`
      )
      .join('');
}


/* ==============================================
   CHART HELPER
============================================== */

function createChart(
  id,
  type,
  labels,
  datasets
) {

  const canvas =
    $(id);


  if (!canvas) {
    return;
  }


  if (charts[id]) {

    charts[id]
      .destroy();
  }


  charts[id] =
    new Chart(
      canvas,
      {

        type,

        data: {
          labels,
          datasets
        },

        options: {

          responsive: true,

          maintainAspectRatio: false,

          plugins: {

            legend: {
              display: true
            }
          },

          scales:
            type === 'bar' ||
            type === 'line'

              ? {
                  y: {
                    beginAtZero: true
                  }
                }

              : {}
        }
      }
    );
}


/* ==============================================
   TREND
============================================== */

function renderTrend() {

  const months =
    [
      ...new Set(
        bridge.map(
          row =>
            N(
              row['Tháng']
            )
        )
      )
    ]
      .filter(Boolean)
      .sort(
        (a, b) =>
          a - b
      );


  const series =
    field =>

      months.map(
        month =>

          sum(
            bridge.filter(
              row =>
                N(
                  row['Tháng']
                ) ===
                month
            ),
            field
          )
      );


  createChart(

    'trend',

    'line',

    months.map(
      month =>
        'T' + month
    ),

    [

      {
        label:
          'Kế hoạch',

        data:
          series(
            'Kế hoạch'
          )
      },

      {
        label:
          'Thực hiện',

        data:
          series(
            'Thực hiện'
          )
      },

      {
        label:
          'Forecast',

        data:
          series(
            'Forecast SXKD'
          )
      }
    ]
  );
}


/* ==============================================
   GAP / PIPELINE BY SPDV
============================================== */

function renderCoverage() {

  const spdvs =
    [
      ...new Set(
        bridge.map(
          row =>
            row.SPDV
        )
      )
    ];


  const gaps =
    [];


  const weighted =
    [];


  spdvs.forEach(
    spdv => {

      const rows =
        bridge.filter(
          row =>
            row.SPDV ===
            spdv
        );


      const plan =
        sum(
          rows,
          'Kế hoạch'
        );


      const forecast =
        sum(
          rows,
          'Forecast SXKD'
        );


      gaps.push(

        Math.max(
          0,
          plan -
          forecast
        )
      );


      weighted.push(

        sum(
          rows.filter(
            row =>
              N(
                row[
                  'Remaining Flag'
                ]
              ) === 1
          ),
          'Weighted Pipeline'
        )
      );
    }
  );


  createChart(

    'coverageChart',

    'bar',

    spdvs,

    [

      {
        label:
          'Phần thiếu KH',

        data:
          gaps
      },

      {
        label:
          'Weighted Pipeline',

        data:
          weighted
      }
    ]
  );
}


/* ==============================================
   STAGE
============================================== */

function renderStages() {

  const stage = {};


  opportunities.forEach(
    row => {

      const name =
        row['Giai đoạn'] ||
        'Khác';


      stage[name] =
        (
          stage[name] ||
          0
        ) +
        N(
          row[
            'Weighted Pipeline'
          ]
        );
    }
  );


  createChart(

    'stage',

    'doughnut',

    Object.keys(
      stage
    ),

    [
      {
        label:
          'Weighted Pipeline',

        data:
          Object.values(
            stage
          )
      }
    ]
  );
}


/* ==============================================
   STALE PIPELINE OWNER
============================================== */

function renderOwners() {

  const owners = {};


  opportunities

    .filter(
      row =>
        N(
          row[
            'Số tuần đứng yên'
          ]
        ) >= 2
    )

    .forEach(
      row => {

        const owner =
          row.Owner ||
          'Chưa phân công';


        owners[owner] =
          (
            owners[owner] ||
            0
          ) +
          N(
            row[
              'Weighted Pipeline'
            ]
          );
      }
    );


  createChart(

    'owner',

    'bar',

    Object.keys(
      owners
    ),

    [
      {
        label:
          'Weighted Pipeline đứng yên',

        data:
          Object.values(
            owners
          )
      }
    ]
  );
}


/* ==============================================
   RISK TABLE
============================================== */

function renderRiskTable() {

  const riskOrder = {

    'Đỏ': 1,

    'Vàng': 2,

    'Xanh': 3
  };


  const rows =
    [...bridge]

      .sort(
        (a, b) => {

          const ra =
            riskOrder[
              a[
                'Cảnh báo điều hành'
              ]
            ] || 9;


          const rb =
            riskOrder[
              b[
                'Cảnh báo điều hành'
              ]
            ] || 9;


          if (ra !== rb) {

            return ra - rb;
          }


          return (
            N(
              a[
                'Gap Forecast/KH'
              ]
            ) -
            N(
              b[
                'Gap Forecast/KH'
              ]
            )
          );
        }
      )

      .slice(
        0,
        20
      );


  $('riskRows')
    .innerHTML =

    rows.map(
      row => {

        const gap =
          N(
            row[
              'Gap Forecast/KH'
            ]
          );


        const coverage =
          N(
            row[
              'Coverage Gap'
            ]
          );


        return `

          <tr>

            <td>
              ${row['Tháng']}
            </td>

            <td>
              ${row.SPDV}
            </td>

            <td>
              ${row['Địa bàn']}
            </td>

            <td>
              ${row['Đơn vị']}
            </td>

            <td class="${
              gap >= 0
                ? 'green'
                : 'red'
            }">
              ${signedMoney(gap)}
            </td>

            <td>
              ${money(
                row[
                  'Weighted Pipeline'
                ]
              )}
            </td>

            <td>
              ${
                coverage >= 999
                  ? 'Đã đạt KH'
                  : coverage.toFixed(1) +
                    'x'
              }
            </td>

            <td>
              ${
                row[
                  'Số CHKD'
                ]
              }
            </td>

            <td>
              ${
                row[
                  'CHKD đứng yên ≥2 tuần'
                ]
              }
            </td>

            <td>
              ${
                row[
                  'Cảnh báo điều hành'
                ]
              }
            </td>

          </tr>
        `;
      }
    )
    .join('');
}


/* ==============================================
   OPPORTUNITY TABLE
============================================== */

function renderOpportunityTable() {

  const rows =
    [...opportunities]

      .sort(
        (a, b) =>

          N(
            b[
              'Weighted Pipeline'
            ]
          ) -

          N(
            a[
              'Weighted Pipeline'
            ]
          )
      )

      .slice(
        0,
        20
      );


  $('opportunityRows')
    .innerHTML =

    rows.map(
      row => `

        <tr>

          <td>
            ${row['Mã CHKD']}
          </td>

          <td>
            ${row['Tên cơ hội']}
          </td>

          <td>
            ${row.SPDV}
          </td>

          <td>
            ${row.Owner || ''}
          </td>

          <td>
            ${money(
              row[
                'Giá trị cơ hội'
              ]
            )}
          </td>

          <td>
            ${percent(
              row[
                'Xác suất'
              ]
            )}
          </td>

          <td>
            ${money(
              row[
                'Weighted Pipeline'
              ]
            )}
          </td>

          <td>
            T${
              row[
                'Tháng dự kiến chốt'
              ]
            }
          </td>

          <td>
            ${
              row[
                'Số tuần đứng yên'
              ]
            }
          </td>

          <td>
            ${
              row[
                'Next action'
              ] || ''
            }
          </td>

        </tr>
      `
    )
    .join('');
}


/* ==============================================
   HELPERS
============================================== */

function sum(
  rows,
  field
) {

  return rows.reduce(

    (total, row) =>

      total +
      N(
        row[field]
      ),

    0
  );
}


function setStatus(
  text,
  success
) {

  const element =
    $('source');


  if (!element) {
    return;
  }


  element.textContent =
    text;


  element.style.fontWeight =
    '600';


  element.style.color =
    success
      ? '#067647'
      : '#b42318';
}


/* ==============================================
   EVENTS
============================================== */

[
  'year',
  'quarter',
  'month',
  'spdv',
  'area',
  'unit'
].forEach(
  id => {

    const element =
      $(id);


    if (element) {

      element.addEventListener(
        'change',
        refreshDashboard
      );
    }
  }
);


$('refresh')
  ?.addEventListener(
    'click',
    refreshDashboard
  );


/* ==============================================
   START
============================================== */

load();
