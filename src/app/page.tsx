import Spreadsheet from "@/components/Sheet";
import 'handsontable/styles/handsontable.min.css';
import 'handsontable/styles/ht-theme-main.min.css';
import { registerAllModules } from 'handsontable/registry';

registerAllModules();

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen sm:p-20 font-[family-name:var(--font-geist-sans)]">
      <div className="bg-light-blue-50 dark:bg-dark-blue-800 p-4 w-full h-full overflow-x-auto flex-grow">
        <Spreadsheet rowCount={3000} columnCount={3000} />
      </div>
      <div className="flex flex-col gap-lg bg-blue-100 p-4 rounded-lg border border-blue-300 text-sm">
        <p className="font-medium mx-auto">Notes from the candidate</p>
        <div className="flex flex-col gap-[0.55rem] mt-3">
          <p>This PoC demonstrates only the simple building blocks that can be used to build an excel clone.</p>
          <p>I have avoided reinventing the wheel completely (writing a full formula parsing engine etc) but the foundational work on which everything can be built is demonstrated.</p>
          <p>While developing it, I realized that developing a 10k x 10k Frontend Grid is not practical. The current approach uses virtualized react-data-grid but even that is not enough only for a few thousands grid. But I did create my own logic of making the formula handling
            of very large grids efficient. I have created a Map which records all the cells that are computed with a formula, and the dependencies of those cells only.
            So if there is a change in the sheet, the engine need not re-render the whole sheet. The Map already tells the engine which cells are affected by the change.
          </p>
          <p>In my opinion, a 10k x 10k Grid will need server support, while this is a Frontend assessment. Mainly, in the following areas </p>
          <ul className="flex flex-col gap-[0.3rem]">
            <li><span className="font-semibold">On-Demand Fetching:&nbsp;</span><span>Only a the in-view + marginal to be fetched from server</span></li>
            <li><span className="font-semibold">Web Workers:&nbsp;</span><span>Compute-intensive tasks need to be separated out from UI rendering</span></li>
            <li><span className="font-semibold">Server Side Rendering/Generation:&nbsp;</span><span>Views like landing state should be rendered on server</span></li>
            <li><span className="font-semibold">Caching:&nbsp;</span><span>Caching of data locally</span></li>
          </ul>
        </div>
      </div>
    </div>
  );
}
