import axios from "axios";
import express, { Request, Response } from "express";
import { URL } from "url";

axios.defaults.timeout = 400;

const app = express();
const port = process.env.PORT || 3000;

type PrefixesResponseType = {
    keyword: string;
    status: string;
    prefix: string;
};

app.get("/", async (req: Request, res: Response) => {
    res.send("Welcome to the Number Management Service!");
});

app.get("/numbers", async (req: Request, res: Response) => {
    if (req.method !== "GET") {
        res.status(405).send("Method not allowed");
        return;
    }
    
    const { url } = req.query as { url: string[] };
    const validUrls: string[] = [];

    url.forEach((link) => {
        if (!validUrls.includes(link) && isValidUrl(link, ["http", "https"])) {
            validUrls.push(link);
        }
    });

    let numbers: number[] = [];

    try {
        const promises: Promise<number[]>[] = [];
        validUrls.forEach((link) => {
            promises.push(fetchNumbersFromUrl(link));
        });
        const responseData = await Promise.all(promises);
        responseData.forEach((data) => {
            numbers = numbers.concat(data);
        });
    } catch (error) {
        console.log(error);
    }

    numbers = numbers
        .sort((a, b) => a - b)
        .filter((x, i, a) => a.indexOf(x) === i);

    res.send(numbers);
});

app.listen(port, () => {
    console.log("Server is listening on port", port);
});

const isValidUrl = (s: string, protocols: string[]): boolean => {
    try {
        const url = new URL(s);
        return protocols
            ? url.protocol
                ? protocols
                      .map((x) => `${x.toLowerCase()}:`)
                      .includes(url.protocol)
                : false
            : true;
    } catch (err) {
        return false;
    }
};

const fetchNumbersFromUrl = (url: string): Promise<number[]> => {
    return axios
        .get(url)
        .then((response) => {
            if (response.status === 200) {
                return response.data.numbers;
            } else {
                return [];
            }
        })
        .catch((error) => {
            console.log(error);
            return [];
        });
};
