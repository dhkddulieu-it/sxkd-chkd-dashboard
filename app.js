const $ = id => document.getElementById(id);

let bridge = [];
let opportunities = [];
let executive = {};
let charts = {};

const N = value => Number(value) || 0;

const money = value =>
  new Intl.NumberFormat('vi-VN', {
    notation: 'compact',
    maximumFractionDigits: 1
  }).format(N(value)) + ' ₫';


/* =====================================================
   LOAD DATA FROM APPS SCRIPT API
===================================================== */

async function load() {

  try {

    setStatus('Đang tải dữ liệu...', false);

    const response = await fetch(
      APP_CONFIG.API_URL + '?dataset=all&t=' + Date.now()
    );

    if (!response.ok) {
      throw new Error(
        'HTTP ' + response.status
      );
    }

    const json = await response.json();

    if (!json.success) {
      throw new Error(
        json.error?.message || 'API trả về lỗi'
      );
    }

    // API mới có cấu trúc json.data.xxx
    bridge = json.data?.bridge || [];
    opportunities =
      json.data?.opportunities || [];

    executive =
      json.data?.executive || {};

    fillFilters();

    render();

    const updated =
      json.meta?.updatedAt
        ? new Date(json.meta.updatedAt)
        : new Date();

    setStatus(
      'LIVE • Cập nhật: ' +
      updated.toLocaleString('vi-VN'),
      true
    );

  } catch (error) {

    console.error(error);

    setStatus(
      'Lỗi kết nối API: ' +
      error.message,
      false
    );

  }
}


/* =====================================================
   STATUS
===================================================== */

function setStatus(text, success) {

  const source = $('source');

  if (!source) return;

  source.textContent = text;

  source.style.fontWeight = '600';

  source.style.color =
    success ? '#067647' : '#b42318';
}


/* =====================================================
   FILTERS
===================================================== */

function fillFilters() {

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


function createOptions(id, field, isMonth = false) {

  const element = $(id);

  if (!element) return;

  const current =
    element.value;

  const first =
    element.options[0]?.outerHTML ||
    '<option value="">Tất cả</option>';

  element.innerHTML = first;

  const values = [
    ...new Set(
      bridge
        .map(row => row[field])
        .filter(
          value =>
            value !== '' &&
            value !== null &&
            value !== undefined
        )
    )
  ];

  values.sort((a, b) => {

    if (
      typeof a === 'number' &&
      typeof b === 'number'
    ) {
      return a - b;
    }

    return String(a)
      .localeCompare(
        String(b),
        'vi'
      );
  });

  values.forEach(value => {

    const label =
      isMonth
        ? 'Tháng ' + value
        : value;

    element.add(
      new Option(label, value)
    );
  });

  if (
    [...element.options]
      .some(option =>
        option.value === current
      )
  ) {
    element.value = current;
  }
}


/* =====================================================
   FILTER ENGINE
===================================================== */

function rowMatches(row) {

  return (
    (
      !$('month').value ||
      String(row['Tháng']) ===
      $('month').value
    ) &&

    (
      !$('spdv').value ||
      row['SPDV'] ===
      $('spdv').value
    ) &&

    (
      !$('area').value ||
      row['Địa bàn'] ===
      $('area').value
    ) &&

    (
      !$('unit').value ||
      row['Đơn vị'] ===
      $('unit').value
    )
  );
}


function opportunityMatches(row) {

  return (
    (
      !$('month').value ||
      String(
        row['Tháng dự kiến chốt']
      ) === $('month').value
    ) &&

    (
      !$('spdv').value ||
      row['SPDV'] ===
      $('spdv').value
    ) &&

    (
      !$('area').value ||
      row['Địa bàn'] ===
      $('area').value
    ) &&

    (
      !$('unit').value ||
      row['Đơn vị'] ===
      $('unit').value
    )
  );
}


/* =====================================================
   HELPERS
===================================================== */

function sum(rows, field) {

  return rows.reduce(
    (total, row) =>
      total + N(row[field]),
    0
  );
}


function createChart(
  id,
  type,
  labels,
  datasets
) {

  if (!$(id)) return;

  if (charts[id]) {
    charts[id].destroy();
  }

  charts[id] =
    new Chart($(id), {

      type: type,

      data: {
        labels: labels,
        datasets: datasets
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
    });
}


/* =====================================================
   MAIN DASHBOARD
===================================================== */

function render() {

  const rows =
    bridge.filter(rowMatches);

  const opps =
    opportunities.filter(
      opportunityMatches
    );

  renderKPI(rows);

  renderTrend(rows);

  renderCoverage(rows);

  renderStages(opps);

  renderOwners(opps);

  renderInsights(rows, opps);

  renderRiskTable(rows);

  renderOpportunityTable(opps);
}


/* =====================================================
   KPI
===================================================== */

function renderKPI(rows) {

  const plan =
    sum(rows, 'Kế hoạch');

  const actual =
    sum(rows, 'Thực hiện');

  const forecast =
    sum(rows, 'Forecast SXKD');

  const weighted =
    sum(rows, 'Weighted Pipeline');

  const shortfall =
    Math.max(
      0,
      plan - forecast
    );

  const coverage =
    shortfall > 0
      ? weighted / shortfall
      : null;


  $('plan').textContent =
    money(plan);

  $('actual').textContent =
    money(actual);

  $('rate').textContent =
    plan
      ? (
          actual /
          plan *
          100
        ).toFixed(1) +
        '% KH'
      : '0% KH';

  $('forecast').textContent =
    money(forecast);


  const gap =
    forecast - plan;

  $('gap').textContent =
    (gap > 0 ? '+' : '') +
    money(gap);

  $('gap').className =
    gap >= 0
      ? 'green'
      : 'red';


  $('weighted').textContent =
    money(weighted);


  $('coverage').textContent =
    coverage === null
      ? 'Đã đạt KH'
      : coverage.toFixed(1) +
        'x';
}


/* =====================================================
   TREND
===================================================== */

function renderTrend(rows) {

  const months = [
    ...new Set(
      rows.map(
        row => row['Tháng']
      )
    )
  ].sort((a, b) => a - b);


  const series = field =>
    months.map(month =>
      sum(
        rows.filter(
          row =>
            row['Tháng'] ===
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
        label: 'Kế hoạch',
        data:
          series('Kế hoạch')
      },

      {
        label: 'Thực hiện',
        data:
          series('Thực hiện')
      },

      {
        label: 'Forecast',
        data:
          series(
            'Forecast SXKD'
          )
      }
    ]
  );
}


/* =====================================================
   GAP VS PIPELINE BY SPDV
===================================================== */

function renderCoverage(rows) {

  const spdvs = [
    ...new Set(
      rows.map(
        row => row.SPDV
      )
    )
  ];


  const gaps =
    spdvs.map(spdv => {

      const group =
        rows.filter(
          row =>
            row.SPDV === spdv
        );

      return Math.max(
        0,
        sum(group, 'Kế hoạch') -
        sum(
          group,
          'Forecast SXKD'
        )
      );
    });


  const weighted =
    spdvs.map(spdv =>
      sum(
        rows.filter(
          row =>
            row.SPDV === spdv
        ),
        'Weighted Pipeline'
      )
    );


  createChart(
    'coverageChart',
    'bar',
    spdvs,

    [
      {
        label:
          'Phần thiếu KH',
        data: gaps
      },

      {
        label:
          'Weighted Pipeline',
        data: weighted
      }
    ]
  );
}


/* =====================================================
   OPPORTUNITY STAGE
===================================================== */

function renderStages(opps) {

  const stage = {};

  opps.forEach(row => {

    const name =
      row['Giai đoạn'] ||
      'Khác';

    stage[name] =
      (stage[name] || 0) +
      N(
        row[
          'Weighted Pipeline'
        ]
      );
  });


  createChart(
    'stage',
    'doughnut',

    Object.keys(stage),

    [
      {
        label:
          'Weighted Pipeline',

        data:
          Object.values(stage)
      }
    ]
  );
}


/* =====================================================
   STALE PIPELINE BY OWNER
===================================================== */

function renderOwners(opps) {

  const owner = {};

  opps
    .filter(
      row =>
        N(
          row[
            'Số tuần đứng yên'
          ]
        ) >= 2
    )

    .forEach(row => {

      const name =
        row.Owner ||
        'Chưa phân công';

      owner[name] =
        (owner[name] || 0) +
        N(
          row[
            'Weighted Pipeline'
          ]
        );
    });


  createChart(
    'owner',
    'bar',

    Object.keys(owner),

    [
      {
        label:
          'Pipeline đứng yên',

        data:
          Object.values(owner)
      }
    ]
  );
}


/* =====================================================
   MANAGEMENT INSIGHTS
===================================================== */

function renderInsights(
  rows,
  opps
) {

  const plan =
    sum(rows, 'Kế hoạch');

  const forecast =
    sum(
      rows,
      'Forecast SXKD'
    );

  const weighted =
    sum(
      rows,
      'Weighted Pipeline'
    );

  const shortfall =
    Math.max(
      0,
      plan - forecast
    );


  const coverage =
    shortfall
      ? weighted /
        shortfall
      : null;


  const red =
    rows.filter(
      row =>
        row[
          'Cảnh báo điều hành'
        ] === 'Đỏ'
    );


  const stale =
    opps.filter(
      row =>
        N(
          row[
            'Số tuần đứng yên'
          ]
        ) >= 2
    );


  const staleValue =
    sum(
      stale,
      'Weighted Pipeline'
    );


  const messages = [

    `Forecast đạt <b>${
      plan
        ? (
            forecast /
            plan *
            100
          ).toFixed(1)
        : '0.0'
    }%</b> kế hoạch.`,

    shortfall > 0
      ? `Còn thiếu <b>${
          money(shortfall)
        }</b> so với kế hoạch.`
      : `Forecast hiện đã <b>đạt hoặc vượt kế hoạch</b>.`,

    coverage !== null
      ? `Weighted Pipeline đang bao phủ <b>${
          coverage.toFixed(1)
        }x</b> phần thiếu.`
      : `Không còn Gap Forecast cần Pipeline bù.`,

    `Có <b>${
      red.length
    }</b> lát cắt đang cảnh báo Đỏ.`,

    `Có <b>${
      stale.length
    }</b> CHKD đứng yên ≥2 tuần, tương ứng <b>${
      money(staleValue)
    }</b> Weighted Pipeline.`
  ];


  $('insights').innerHTML =
    messages
      .map(
        message =>
          `<li>${message}</li>`
      )
      .join('');
}


/* =====================================================
   MANAGEMENT RISK TABLE
===================================================== */

function renderRiskTable(rows) {

  const sorted =
    [...rows]

      .sort((a, b) => {

        const riskOrder = {
          'Đỏ': 1,
          'Vàng': 2,
          'Xanh': 3
        };

        return (
          (
            riskOrder[
              a[
                'Cảnh báo điều hành'
              ]
            ] || 9
          ) -
          (
            riskOrder[
              b[
                'Cảnh báo điều hành'
              ]
            ] || 9
          )
        );
      })

      .slice(0, 20);


  $('rows').innerHTML =
    sorted.map(row => {

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

          <td>${row['Tháng']}</td>

          <td>${row.SPDV}</td>

          <td>${row['Địa bàn']}</td>

          <td>${row['Đơn vị']}</td>

          <td class="${
            gap < 0
              ? 'red'
              : 'green'
          }">
            ${money(gap)}
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
            ${row['Số CHKD']}
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

    }).join('');
}


/* =====================================================
   PRIORITY OPPORTUNITIES
===================================================== */

function renderOpportunityTable(opps) {

  const sorted =
    [...opps]

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

      .slice(0, 20);


  $('oppRows').innerHTML =
    sorted.map(row => `

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
          ${row.Owner}
        </td>

        <td>
          ${money(
            row[
              'Giá trị cơ hội'
            ]
          )}
        </td>

        <td>
          ${(
            N(
              row['Xác suất']
            ) * 100
          ).toFixed(0)}%
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

    `).join('');
}


/* =====================================================
   EVENTS
===================================================== */

[
  'month',
  'spdv',
  'area',
  'unit'
].forEach(id => {

  const element = $(id);

  if (element) {
    element.addEventListener(
      'change',
      render
    );
  }

});


if ($('refresh')) {

  $('refresh')
    .addEventListener(
      'click',
      load
    );
}


/* =====================================================
   START APPLICATION
===================================================== */

load();
